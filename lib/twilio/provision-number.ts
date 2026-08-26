import { prisma } from "@/lib/db/prisma";
import { normalizeE164 } from "@/lib/telephony/e164";
import {
  createByoSipCredential,
  importByoPhoneNumber,
  deleteByoPhoneNumber,
} from "@/lib/telephony/vapi-sip";

export type ImportSipNumberOptions = {
  didNumber: string;
  sipServer: string;
  sipUsername: string;
  sipPassword: string;
  providerName?: string;
  /** Business carrier number that will USSD-forward to this DID. */
  customerNumber?: string | null;
};

type ImportSipResult = {
  phoneNumber: string;
  vapiPhoneNumberId: string;
};

/**
 * Imports a BYO SIP phone number from any provider into Vapi.
 *
 * 1. Finds or creates a SipCredential for this provider + server + username.
 * 2. Creates a Vapi BYO SIP credential if one doesn't exist yet.
 * 3. Imports the number into Vapi with the credential.
 * 4. Stores the mapping in TwilioPhoneNumber table.
 */
export async function importSipNumber(
  orgId: string,
  agentId: string,
  options: ImportSipNumberOptions,
): Promise<ImportSipResult> {
  const e164 = normalizeE164(options.didNumber);
  const customerNumber = options.customerNumber
    ? normalizeE164(options.customerNumber)
    : null;

  const sipServer = options.sipServer.trim();
  const sipUsername = options.sipUsername.trim();
  const sipPassword = options.sipPassword.trim();

  if (!sipServer || !sipUsername || !sipPassword) {
    throw new Error("SIP server, username, and password are required");
  }

  // Find or create SipCredential
  let sipCredential = await prisma.sipCredential.findUnique({
    where: {
      orgId_sipServer_sipUsername: {
        orgId,
        sipServer,
        sipUsername,
      },
    },
  });

  if (!sipCredential) {
    sipCredential = await prisma.sipCredential.create({
      data: {
        orgId,
        name: options.providerName || sipServer,
        sipServer,
        sipUsername,
        sipPassword,
      },
    });
  }

  // Create Vapi BYO SIP credential if not yet done
  let vapiCredentialId = sipCredential.vapiCredentialId;
  if (!vapiCredentialId) {
    vapiCredentialId = await createByoSipCredential({
      name: `${options.providerName || sipServer}-${orgId.slice(0, 8)}`,
      sipServer,
      sipUsername,
      sipPassword,
    });

    await prisma.sipCredential.update({
      where: { id: sipCredential.id },
      data: { vapiCredentialId },
    });
  }

  // Import number into Vapi
  let vapiPhoneNumberId: string;
  try {
    vapiPhoneNumberId = await importByoPhoneNumber(e164, vapiCredentialId);
  } catch (err) {
    throw err;
  }

  // Save to DB
  try {
    await prisma.twilioPhoneNumber.upsert({
      where: { twilioNumber: e164 },
      update: {
        orgId,
        agentId,
        isActive: true,
        customerNumber,
        forwardingVerifiedAt: null,
        sipCredentialId: sipCredential.id,
        vapiPhoneNumberId,
      },
      create: {
        twilioNumber: e164,
        orgId,
        agentId,
        isActive: true,
        customerNumber,
        forwardingVerifiedAt: null,
        sipCredentialId: sipCredential.id,
        vapiPhoneNumberId,
      },
    });
  } catch (err) {
    try {
      await deleteByoPhoneNumber(vapiPhoneNumberId);
    } catch {
      // best-effort cleanup
    }
    throw err;
  }

  return { phoneNumber: e164, vapiPhoneNumberId };
}

/**
 * Releases a provisioned phone number.
 * Deactivates the mapping in DB and removes from Vapi.
 */
export async function releasePhoneNumber(
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
        sipCredentialId: true,
      },
    });

    if (!mapping || mapping.orgId !== orgId) {
      return { success: false, error: "Number not found or not owned by this organization" };
    }

    // Deactivate the number
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
      } catch {
        // Vapi cleanup failed — DB is already updated
      }
    }

    // Clean up orphaned SipCredential (no other active numbers reference it)
    if (mapping.sipCredentialId) {
      const remaining = await prisma.twilioPhoneNumber.count({
        where: {
          sipCredentialId: mapping.sipCredentialId,
          isActive: true,
        },
      });

      if (remaining === 0) {
        await prisma.sipCredential.delete({
          where: { id: mapping.sipCredentialId },
        }).catch(() => {
          // best-effort cleanup
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

/**
 * Counts how many active phone numbers an org has.
 */
export async function countOrgPhoneNumbers(orgId: string): Promise<number> {
  return prisma.twilioPhoneNumber.count({
    where: { orgId, isActive: true },
  });
}

/**
 * Marks carrier→DID forwarding as verified after the first successful inbound call.
 */
export async function markForwardingVerified(didE164: string): Promise<void> {
  const e164 = normalizeE164(didE164);
  await prisma.twilioPhoneNumber.updateMany({
    where: {
      twilioNumber: e164,
      isActive: true,
      customerNumber: { not: null },
      forwardingVerifiedAt: null,
    },
    data: { forwardingVerifiedAt: new Date() },
  });
}
