"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  importByoPhoneNumber,
  deleteByoPhoneNumber,
  getVapiTelnyxCredentialId,
} from "@/lib/telephony/vapi-sip";

/**
 * Imports a Telnyx phone number into Vapi as a BYO phone number.
 *
 * This registers the number with Vapi's BYOC SIP trunk so that
 * incoming calls to the number are routed to Vapi's AI voice pipeline.
 *
 * @param number - The number in E.164 format (e.g. "+212522XXXXXX")
 * @returns The Vapi phone number resource ID (stored in DB)
 */
export async function importByocNumberToVapi(
  number: string,
): Promise<{ success: boolean; vapiPhoneNumberId?: string; error?: string }> {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const credentialId = getVapiTelnyxCredentialId();
  if (!credentialId) {
    return {
      success: false,
      error:
        "VAPI_TELNYX_CREDENTIAL_ID is not set. Create a Telnyx SIP credential in Vapi first.",
    };
  }

  // Check if this number is already registered to another org
  const existing = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber: number },
  });

  if (existing && existing.orgId !== orgId) {
    return {
      success: false,
      error: "Number is already registered to another organization.",
    };
  }

  try {
    const vapiPhoneNumberId = await importByoPhoneNumber(number, credentialId);

    // Store the Vapi phone number ID in the DB
    if (existing) {
      await prisma.twilioPhoneNumber.update({
        where: { twilioNumber: number },
        data: { vapiPhoneNumberId },
      });
    }

    return { success: true, vapiPhoneNumberId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Vapi BYOC import failed",
    };
  }
}

/**
 * Removes a BYO phone number from Vapi.
 */
export async function removeByocNumberFromVapi(
  vapiPhoneNumberId: string,
): Promise<void> {
  try {
    await deleteByoPhoneNumber(vapiPhoneNumberId);
  } catch {
    // Best-effort cleanup
  }
}
