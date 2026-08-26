import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";
import {
  provisionMoroccanDid,
  forwardDid,
  releaseDid as pbxmeReleaseDid,
} from "@/lib/pbxme/client";
import {
  createByoSipCredential,
  importByoPhoneNumber,
  deleteByoPhoneNumber,
} from "@/lib/telephony/vapi-sip";
import { updateRouting } from "@/lib/sip/router";
import { normalizeE164 } from "@/lib/telephony/e164";

// ponytail: Provisioning orchestrator. Buys a Moroccan DID from PBXme,
// creates Vapi BYO SIP credentials, forwards PBXme DID to Vapi, saves to DB.

// ── Shared Vapi credential (created once, reused per org) ──────────────────

let _vapiCredentialId: string | null = null;

/**
 * Ensure the shared Vapi BYO SIP inbound credential exists.
 * This credential accepts calls from PBXme → Vapi.
 * Created once per platform, reused for all orgs.
 */
async function ensureVapiInboundCredential(): Promise<string> {
  if (_vapiCredentialId) return _vapiCredentialId;

  // Check if we already have one stored
  const existing = await prisma.sipCredential.findFirst({
    where: { name: "vocally-pbxme-inbound" },
    select: { vapiCredentialId: true },
  });

  if (existing?.vapiCredentialId) {
    _vapiCredentialId = existing.vapiCredentialId;
    return existing.vapiCredentialId;
  }

  // Create a new credential that accepts calls from PBXme
  // For inbound, we just need the credential - no gateway IP needed
  // because PBXme will send calls to {credential_id}.sip.vapi.ai
  const vapiCredentialId = await createByoSipCredential({
    name: "vocally-pbxme-inbound",
    sipServer: "sip.vapi.ai", // Vapi's SIP endpoint
    sipUsername: "vapi", // Not used for inbound
    sipPassword: "vapi", // Not used for inbound
  });

  // Store for future reference
  const platformOrg = await prisma.organization.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (platformOrg) {
    await prisma.sipCredential.create({
      data: {
        orgId: platformOrg.id,
        name: "vocally-pbxme-inbound",
        sipServer: "sip.vapi.ai",
        sipUsername: "platform",
        sipPassword: "platform-shared",
        vapiCredentialId,
      },
    });
  }

  _vapiCredentialId = vapiCredentialId;
  logServerWarning("[Provision] Created Vapi inbound credential", { vapiCredentialId });
  return vapiCredentialId;
}

// ── Main provisioning function ─────────────────────────────────────────────

export type ProvisionResult = {
  phoneNumber: string;
  pbxmeDidId: string;
  vapiPhoneNumberId: string;
};

/**
 * Provision a new Moroccan number end-to-end:
 * 1. Buy DID from PBXme
 * 2. Create Vapi BYO SIP credential (inbound from PBXme)
 * 3. Register number with Vapi
 * 4. Forward PBXme DID to Vapi SIP endpoint
 * 5. Save to DB
 */
export async function provisionNumber(
  orgId: string,
  agentId: string,
): Promise<ProvisionResult> {
  // 1. Buy DID from PBXme
  const { didId, number } = await provisionMoroccanDid();
  const e164 = normalizeE164(number);

  logServerWarning("[Provision] PBXme DID purchased", { didId, number: e164 });

  // 2. Ensure Vapi inbound credential exists
  let vapiCredentialId: string;
  try {
    vapiCredentialId = await ensureVapiInboundCredential();
  } catch (err) {
    logServerWarning("[Provision] Failed to create Vapi inbound credential", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  // 3. Register number with Vapi
  let vapiPhoneNumberId: string;
  try {
    vapiPhoneNumberId = await importByoPhoneNumber(e164, vapiCredentialId);
  } catch (err) {
    logServerWarning("[Provision] Failed to register number with Vapi", {
      number: e164,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  // 4. Forward PBXme DID to Vapi SIP endpoint
  try {
    // Forward to Vapi's SIP endpoint: {credential_id}.sip.vapi.ai
    const vapiSipUri = `sip:${vapiCredentialId}@sip.vapi.ai`;
    await forwardDid(didId, vapiSipUri, "sip");
    logServerWarning("[Provision] Forwarded PBXme DID to Vapi", {
      didId,
      vapiSipUri,
    });
  } catch (err) {
    logServerWarning("[Provision] Failed to forward PBXme DID (non-fatal)", {
      didId,
      error: err instanceof Error ? err.message : String(err),
    });
    // Non-fatal - user can forward manually
  }

  // 5. Save to DB
  try {
    await prisma.twilioPhoneNumber.upsert({
      where: { twilioNumber: e164 },
      update: {
        orgId,
        agentId,
        isActive: true,
        didwwNumberId: didId, // Reuse existing column for PBXme DID ID
        vapiPhoneNumberId,
        customerNumber: null,
        forwardingVerifiedAt: null,
      },
      create: {
        twilioNumber: e164,
        orgId,
        agentId,
        isActive: true,
        didwwNumberId: didId, // Reuse existing column for PBXme DID ID
        vapiPhoneNumberId,
        customerNumber: null,
        forwardingVerifiedAt: null,
      },
    });
  } catch (err) {
    // Cleanup: remove from Vapi and PBXme
    try {
      await deleteByoPhoneNumber(vapiPhoneNumberId);
    } catch { /* best-effort */ }
    try {
      await pbxmeReleaseDid(didId);
    } catch { /* best-effort */ }
    throw err;
  }

  // 6. Update routing
  await updateRouting(e164);

  logServerWarning("[Provision] Number fully provisioned", {
    orgId,
    agentId,
    number: e164,
    pbxmeDidId: didId,
    vapiId: vapiPhoneNumberId,
  });

  return { phoneNumber: e164, pbxmeDidId: didId, vapiPhoneNumberId };
}

// ── Release (deprovision) ──────────────────────────────────────────────────

export async function releaseNumber(
  orgId: string,
  phoneNumber: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const e164 = normalizeE164(phoneNumber);
    const mapping = await prisma.twilioPhoneNumber.findUnique({
      where: { twilioNumber: e164 },
      select: {
        orgId: true,
        isActive: true,
        vapiPhoneNumberId: true,
        didwwNumberId: true, // PBXme DID ID
      },
    });

    if (!mapping || mapping.orgId !== orgId) {
      return { success: false, error: "Number not found or not owned by this organization" };
    }

    // Deactivate in DB
    await prisma.twilioPhoneNumber.update({
      where: { twilioNumber: e164 },
      data: {
        isActive: false,
        agentId: null,
        customerNumber: null,
        forwardingVerifiedAt: null,
        sipCredentialId: null,
      },
    });

    // Remove from Vapi
    if (mapping.vapiPhoneNumberId) {
      try {
        await deleteByoPhoneNumber(mapping.vapiPhoneNumberId);
      } catch { /* Vapi cleanup failed */ }
    }

    // Release from PBXme (best-effort)
    if (mapping.didwwNumberId) {
      try {
        await pbxmeReleaseDid(mapping.didwwNumberId);
        logServerWarning("[Provision] Released PBXme DID", {
          pbxmeDidId: mapping.didwwNumberId,
        });
      } catch (err) {
        logServerWarning("[Provision] Failed to release PBXme DID (non-fatal)", {
          pbxmeDidId: mapping.didwwNumberId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to release phone number",
    };
  }
}

// ── Count active numbers per org ───────────────────────────────────────────

export async function countOrgPhoneNumbers(orgId: string): Promise<number> {
  return prisma.twilioPhoneNumber.count({
    where: { orgId, isActive: true },
  });
}
