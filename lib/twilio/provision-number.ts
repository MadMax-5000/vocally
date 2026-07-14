import { prisma } from "@/lib/db/prisma";
import { searchAndOrderNumber, releaseNumber } from "@/lib/telephony/telnyx";
import {
  importByoPhoneNumber,
  deleteByoPhoneNumber,
  getVapiTelnyxCredentialId,
} from "@/lib/telephony/vapi-sip";

type ProvisionResult = {
  phoneNumber: string;
  telnyxOrderId: string;
  friendlyName: string;
};

/**
 * Provisions a Moroccan (+212) phone number via Telnyx
 * and registers it in Vapi as a BYO phone number.
 *
 * 1. Searches + orders a new number from Telnyx inventory.
 * 2. Imports the number into Vapi as a BYO phone number.
 * 3. Stores the mapping in TwilioPhoneNumber table.
 *
 * Returns the provisioned number details.
 */
export async function provisionPhoneNumber(
  orgId: string,
  agentId: string,
): Promise<ProvisionResult> {
  // 1. Search and order a Moroccan number from Telnyx
  const { phoneNumber, orderId } = await searchAndOrderNumber();

  // 2. Import into Vapi as BYO phone number
  const credentialId = getVapiTelnyxCredentialId();
  if (!credentialId) {
    throw new Error(
      "VAPI_TELNYX_CREDENTIAL_ID is not set. Create a Telnyx SIP credential in Vapi first.",
    );
  }
  const vapiPhoneNumberId = await importByoPhoneNumber(phoneNumber, credentialId);

  // 3. Store mapping in DB
  await prisma.twilioPhoneNumber.upsert({
    where: { twilioNumber: phoneNumber },
    update: {
      orgId,
      agentId,
      isActive: true,
      customerNumber: null,
      telnyxOrderId: orderId,
      vapiPhoneNumberId,
    },
    create: {
      twilioNumber: phoneNumber,
      orgId,
      agentId,
      isActive: true,
      telnyxOrderId: orderId,
      vapiPhoneNumberId,
    },
  });

  return {
    phoneNumber,
    telnyxOrderId: orderId,
    friendlyName: phoneNumber,
  };
}

/**
 * Releases a provisioned phone number.
 * Deactivates the mapping in DB, removes from Vapi, and releases from Telnyx.
 */
export async function releasePhoneNumber(
  orgId: string,
  phoneNumber: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const mapping = await prisma.twilioPhoneNumber.findUnique({
      where: { twilioNumber: phoneNumber },
      select: { orgId: true, isActive: true, vapiPhoneNumberId: true, telnyxOrderId: true },
    });

    if (!mapping || mapping.orgId !== orgId) {
      return { success: false, error: "Number not found or not owned by this organization" };
    }

    // Deactivate in DB first
    await prisma.twilioPhoneNumber.update({
      where: { twilioNumber: phoneNumber },
      data: { isActive: false, agentId: null, customerNumber: null },
    });

    // Remove from Vapi (best-effort)
    if (mapping.vapiPhoneNumberId) {
      try {
        await deleteByoPhoneNumber(mapping.vapiPhoneNumberId);
      } catch {
        // Vapi cleanup failed — DB is already updated
      }
    }

    // Release from Telnyx (best-effort)
    if (mapping.telnyxOrderId) {
      try {
        await releaseNumber(mapping.telnyxOrderId);
      } catch {
        // Telnyx cleanup failed — DB is already updated
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
