"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  createByoSipCredential,
  importByoPhoneNumber,
  deleteByoPhoneNumber,
} from "@/lib/telephony/vapi-sip";
import { normalizeE164 } from "@/lib/telephony/e164";

/**
 * Imports a phone number into Vapi using an existing SipCredential
 * and stores the Vapi phone number ID on the existing DB row.
 */
export async function importByocNumberToVapi(
  number: string,
  sipCredentialId: string,
): Promise<{ success: boolean; vapiPhoneNumberId?: string; error?: string }> {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const sipCredential = await prisma.sipCredential.findFirst({
    where: { id: sipCredentialId, orgId },
  });
  if (!sipCredential) {
    return { success: false, error: "SIP credential not found" };
  }

  const e164 = normalizeE164(number);

  const existing = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber: e164 },
  });

  if (existing && existing.orgId !== orgId) {
    return {
      success: false,
      error: "Number is already registered to another organization.",
    };
  }

  // Create Vapi credential if needed
  let vapiCredentialId = sipCredential.vapiCredentialId;
  if (!vapiCredentialId) {
    vapiCredentialId = await createByoSipCredential({
      name: `${sipCredential.name}-${orgId.slice(0, 8)}`,
      sipServer: sipCredential.sipServer,
      sipUsername: sipCredential.sipUsername,
      sipPassword: sipCredential.sipPassword,
    });

    await prisma.sipCredential.update({
      where: { id: sipCredentialId },
      data: { vapiCredentialId },
    });
  }

  try {
    const vapiPhoneNumberId = await importByoPhoneNumber(e164, vapiCredentialId);

    if (existing) {
      await prisma.twilioPhoneNumber.update({
        where: { twilioNumber: e164 },
        data: { vapiPhoneNumberId, sipCredentialId: sipCredential.id },
      });
    }

    return { success: true, vapiPhoneNumberId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Vapi BYO import failed",
    };
  }
}

/**
 * Removes a phone number from Vapi.
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
