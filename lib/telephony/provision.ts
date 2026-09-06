import { bindPhoneNumberAgent, importPhoneNumber } from "@/lib/assemblyai/client";
import { isAssemblyAiConfigured } from "@/lib/assemblyai/env";
import { usesAssemblyAiVoicePipeline } from "@/lib/assemblyai/pipeline";
import { ASSEMBLYAI_SIP_URI } from "@/lib/assemblyai/sip";
import { syncAssemblyAiAgent } from "@/lib/assemblyai/sync-agent";
import { prisma } from "@/lib/db/prisma";
import {
  assertAssemblyAiByocEnv,
  assertAssemblyAiPhoneEnv,
  assertPhoneDeployEnv,
} from "@/lib/env/validation";
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
  vapiPhoneNumberId?: string;
  pipeline: "assemblyai" | "vapi";
};

async function loadPipelineForAgent(agentId: string): Promise<"assemblyai" | "vapi"> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      defaultLanguage: true,
      languages: { select: { language: true } },
      channels: { select: { channel: true, config: true } },
    },
  });
  if (!agent) return "vapi";

  const voiceChannel = agent.channels.find((c) => c.channel === "VOICE_CALLS");
  const config = (voiceChannel?.config ?? {}) as { language?: string };

  return usesAssemblyAiVoicePipeline({
    defaultLanguage: agent.defaultLanguage,
    languages: agent.languages.map((l) => l.language),
    phoneLanguage: config.language,
    assemblyAiConfigured: isAssemblyAiConfigured(),
  })
    ? "assemblyai"
    : "vapi";
}

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
  const pipeline = await loadPipelineForAgent(agentId);
  if (pipeline === "assemblyai") {
    return provisionAssemblyAiNumber(orgId, agentId);
  }

  assertPhoneDeployEnv();

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

  return { phoneNumber: e164, pbxmeDidId: didId, vapiPhoneNumberId, pipeline: "vapi" };
}

async function provisionAssemblyAiNumber(
  orgId: string,
  agentId: string,
): Promise<ProvisionResult> {
  assertAssemblyAiPhoneEnv();

  const assemblyaiAgentId = await syncAssemblyAiAgent(agentId);
  if (!assemblyaiAgentId) {
    throw new Error("Failed to sync AssemblyAI agent for EN/FR phone pipeline");
  }

  const { didId, number } = await provisionMoroccanDid();
  const e164 = normalizeE164(number);

  logServerWarning("[Provision] PBXme DID purchased for AssemblyAI", { didId, number: e164 });

  try {
    await importPhoneNumber(e164);
    await bindPhoneNumberAgent(e164, assemblyaiAgentId);
  } catch (err) {
    logServerWarning("[Provision] AssemblyAI phone import/bind failed (continuing SIP forward)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await forwardDid(didId, ASSEMBLYAI_SIP_URI, "sip");
    logServerWarning("[Provision] Forwarded PBXme DID to AssemblyAI SIP", {
      didId,
    });
  } catch (err) {
    logServerWarning("[Provision] Failed to forward PBXme DID (non-fatal)", {
      didId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await prisma.twilioPhoneNumber.upsert({
      where: { twilioNumber: e164 },
      update: {
        orgId,
        agentId,
        isActive: true,
        didwwNumberId: didId,
        vapiPhoneNumberId: null,
        assemblyaiBound: true,
        customerNumber: null,
        forwardingVerifiedAt: null,
      },
      create: {
        twilioNumber: e164,
        orgId,
        agentId,
        isActive: true,
        didwwNumberId: didId,
        assemblyaiBound: true,
        customerNumber: null,
        forwardingVerifiedAt: null,
      },
    });
  } catch (err) {
    try {
      await pbxmeReleaseDid(didId);
    } catch { /* best-effort */ }
    throw err;
  }

  await updateRouting(e164);

  logServerWarning("[Provision] Number fully provisioned on AssemblyAI", {
    orgId,
    agentId,
    number: e164,
    pbxmeDidId: didId,
  });

  return { phoneNumber: e164, pbxmeDidId: didId, pipeline: "assemblyai" };
}

export type ByocProvisionResult = {
  /** Number AssemblyAI / routing listens on (carrier itself for SIP BYOP, or platform DID for USSD). */
  phoneNumber: string;
  carrierNumber: string;
  /** ussd = forward carrier → platform DID; sip = carrier SIP trunk → AssemblyAI. */
  mode: "ussd" | "sip";
  sipUri: string;
  pipeline: "assemblyai" | "vapi";
  pbxmeDidId?: string;
};

/**
 * BYOC: connect an existing Moroccan carrier number (+212).
 *
 * Morocco (ANRT / local integrators): wholesale DID resale is not the legal path;
 * BYOC/BYOP is. Default: import the carrier number into AssemblyAI and instruct
 * the customer (or their SIP provider) to route that DID to sip.assemblyai.com.
 *
 * Optional: set PHONE_BYOC_TRY_PBXME=1 to attempt buying a platform DID for USSD
 * *21* forwarding when inventory exists.
 */
export async function provisionByocCarrierNumber(
  orgId: string,
  agentId: string,
  carrierNumber: string,
): Promise<ByocProvisionResult> {
  const carrierE164 = normalizeE164(carrierNumber);
  const pipeline = await loadPipelineForAgent(agentId);

  if (pipeline === "vapi") {
    return provisionVapiByoc(orgId, agentId, carrierE164);
  }

  return provisionAssemblyAiByoc(orgId, agentId, carrierE164);
}

async function provisionAssemblyAiByoc(
  orgId: string,
  agentId: string,
  carrierE164: string,
): Promise<ByocProvisionResult> {
  assertAssemblyAiByocEnv();

  const assemblyaiAgentId = await syncAssemblyAiAgent(agentId);
  if (!assemblyaiAgentId) {
    throw new Error("Failed to sync AssemblyAI agent for BYOC phone");
  }

  const tryPbxme = process.env.PHONE_BYOC_TRY_PBXME?.trim() === "1";

  if (tryPbxme) {
    try {
      assertAssemblyAiPhoneEnv();
      const { didId, number } = await provisionMoroccanDid();
      const forwardE164 = normalizeE164(number);

      try {
        await importPhoneNumber(forwardE164);
        await bindPhoneNumberAgent(forwardE164, assemblyaiAgentId);
      } catch (err) {
        logServerWarning("[BYOC] AssemblyAI import/bind of forward DID failed (continuing)", {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      try {
        await forwardDid(didId, ASSEMBLYAI_SIP_URI, "sip");
      } catch (err) {
        logServerWarning("[BYOC] PBXme → AssemblyAI SIP forward failed (non-fatal)", {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await prisma.twilioPhoneNumber.upsert({
        where: { twilioNumber: forwardE164 },
        update: {
          orgId,
          agentId,
          isActive: true,
          didwwNumberId: didId,
          vapiPhoneNumberId: null,
          assemblyaiBound: true,
          customerNumber: carrierE164,
          forwardingVerifiedAt: null,
        },
        create: {
          twilioNumber: forwardE164,
          orgId,
          agentId,
          isActive: true,
          didwwNumberId: didId,
          assemblyaiBound: true,
          customerNumber: carrierE164,
          forwardingVerifiedAt: null,
        },
      });

      await updateRouting(forwardE164);

      logServerWarning("[BYOC] USSD mode — platform DID + carrier", {
        carrierE164,
        forwardE164,
        didId,
      });

      return {
        phoneNumber: forwardE164,
        carrierNumber: carrierE164,
        mode: "ussd",
        sipUri: ASSEMBLYAI_SIP_URI,
        pipeline: "assemblyai",
        pbxmeDidId: didId,
      };
    } catch (err) {
      logServerWarning("[BYOC] PBXme USSD path failed — falling back to SIP BYOP", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // SIP BYOP: import the carrier number itself; customer/VoIPSense routes SIP here.
  await importPhoneNumber(carrierE164);
  await bindPhoneNumberAgent(carrierE164, assemblyaiAgentId);

  await prisma.twilioPhoneNumber.upsert({
    where: { twilioNumber: carrierE164 },
    update: {
      orgId,
      agentId,
      isActive: true,
      didwwNumberId: null,
      vapiPhoneNumberId: null,
      assemblyaiBound: true,
      customerNumber: carrierE164,
      forwardingVerifiedAt: null,
    },
    create: {
      twilioNumber: carrierE164,
      orgId,
      agentId,
      isActive: true,
      assemblyaiBound: true,
      customerNumber: carrierE164,
      forwardingVerifiedAt: null,
    },
  });

  await updateRouting(carrierE164);

  logServerWarning("[BYOC] SIP BYOP mode — carrier imported to AssemblyAI", {
    carrierE164,
    assemblyaiAgentId,
  });

  return {
    phoneNumber: carrierE164,
    carrierNumber: carrierE164,
    mode: "sip",
    sipUri: ASSEMBLYAI_SIP_URI,
    pipeline: "assemblyai",
  };
}

async function provisionVapiByoc(
  orgId: string,
  agentId: string,
  carrierE164: string,
): Promise<ByocProvisionResult> {
  // Arabic path still needs a PSTN DID → Vapi SIP. Try PBXme buy + attach carrier.
  assertPhoneDeployEnv();

  const { didId, number } = await provisionMoroccanDid();
  const forwardE164 = normalizeE164(number);

  const vapiCredentialId = await ensureVapiInboundCredential();
  const vapiPhoneNumberId = await importByoPhoneNumber(forwardE164, vapiCredentialId);

  try {
    await forwardDid(didId, `sip:${vapiCredentialId}@sip.vapi.ai`, "sip");
  } catch (err) {
    logServerWarning("[BYOC] Vapi SIP forward failed (non-fatal)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await prisma.twilioPhoneNumber.upsert({
    where: { twilioNumber: forwardE164 },
    update: {
      orgId,
      agentId,
      isActive: true,
      didwwNumberId: didId,
      vapiPhoneNumberId,
      assemblyaiBound: false,
      customerNumber: carrierE164,
      forwardingVerifiedAt: null,
    },
    create: {
      twilioNumber: forwardE164,
      orgId,
      agentId,
      isActive: true,
      didwwNumberId: didId,
      vapiPhoneNumberId,
      customerNumber: carrierE164,
      forwardingVerifiedAt: null,
    },
  });

  await updateRouting(forwardE164);

  return {
    phoneNumber: forwardE164,
    carrierNumber: carrierE164,
    mode: "ussd",
    sipUri: `sip:${vapiCredentialId}@sip.vapi.ai`,
    pipeline: "vapi",
    pbxmeDidId: didId,
  };
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
        assemblyaiBound: false,
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
