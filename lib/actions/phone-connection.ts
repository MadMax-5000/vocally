"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  importSipNumber,
  releasePhoneNumber,
  countOrgPhoneNumbers,
} from "@/lib/twilio/provision-number";
import {
  provisionNumber,
  releaseNumber as pbxmeReleaseNumber,
  countOrgPhoneNumbers as pbxmeCountNumbers,
} from "@/lib/telephony/provision";
import { MAX_PHONE_NUMBERS } from "@/lib/billing/plan-features";
import { isMoroccanE164, normalizeE164 } from "@/lib/telephony/e164";

const moroccanE164Schema = z
  .string()
  .trim()
  .transform((v) => normalizeE164(v))
  .refine((v) => isMoroccanE164(v), {
    message: "Enter a valid Moroccan phone number (e.g. +212612345678 or 0612345678)",
  });

export type PhoneConnectionSettings = {
  numbers: Array<{
    id: string;
    number: string;
    customerNumber: string | null;
    isActive: boolean;
    forwardingVerifiedAt: Date | null;
    createdAt: Date;
  }>;
  maxNumbers: number;
  currentCount: number;
};

export async function emptyPhoneConnectionSettings(): Promise<PhoneConnectionSettings> {
  return {
    numbers: [],
    maxNumbers: MAX_PHONE_NUMBERS.FREE,
    currentCount: 0,
  };
}

export async function getPhoneConnectionSettings(
  agentId: string,
): Promise<{ success: true; data: PhoneConnectionSettings } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });

    const numbers = await prisma.twilioPhoneNumber.findMany({
      where: { orgId, agentId },
      orderBy: { createdAt: "desc" },
    });

    const plan = org?.plan ?? "FREE";
    const maxNumbers = MAX_PHONE_NUMBERS[plan];

    return {
      success: true,
      data: {
        numbers: numbers.map((n) => ({
          id: n.id,
          number: n.twilioNumber,
          customerNumber: n.customerNumber,
          isActive: n.isActive,
          forwardingVerifiedAt: n.forwardingVerifiedAt,
          createdAt: n.createdAt,
        })),
        maxNumbers,
        currentCount: numbers.filter((n) => n.isActive).length,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load phone settings";
    return { success: false, error: message };
  }
}

export async function disconnectPhoneNumber(
  phoneNumber: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const result = await releasePhoneNumber(orgId, phoneNumber);
    if (!result.success) {
      return { success: false, error: result.error ?? "Failed to disconnect phone number" };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect phone number";
    return { success: false, error: message };
  }
}

export type SipImportResult = {
  didNumber: string;
};

/**
 * Imports a BYO SIP phone number from any provider.
 * Takes the DID number + SIP credentials, creates/looks up the Vapi credential,
 * imports the number into Vapi, and saves to DB.
 */
export async function importSipPhoneNumber(
  agentId: string,
  didNumber: string,
  sipServer: string,
  sipUsername: string,
  sipPassword: string,
  providerName?: string,
): Promise<{ success: true; data: SipImportResult } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const parsed = moroccanE164Schema.safeParse(didNumber);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid phone number",
      };
    }

    if (!sipServer.trim() || !sipUsername.trim() || !sipPassword.trim()) {
      return { success: false, error: "SIP server, username, and password are required" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    const plan = org?.plan ?? "FREE";
    const maxNumbers = MAX_PHONE_NUMBERS[plan];

    const currentCount = await countOrgPhoneNumbers(orgId);
    if (currentCount >= maxNumbers) {
      return {
        success: false,
        error: `You've reached the maximum number of phone numbers for your ${plan} plan. Upgrade to add more.`,
      };
    }

    const existingNumber = await prisma.twilioPhoneNumber.findUnique({
      where: { twilioNumber: parsed.data },
      select: { orgId: true, isActive: true },
    });

    if (existingNumber && existingNumber.orgId !== orgId) {
      return {
        success: false,
        error: "This phone number is already registered to another organization.",
      };
    }

    if (existingNumber && existingNumber.isActive) {
      return {
        success: false,
        error: "This phone number is already active in your organization.",
      };
    }

    const result = await importSipNumber(orgId, agentId, {
      didNumber: parsed.data,
      sipServer: sipServer.trim(),
      sipUsername: sipUsername.trim(),
      sipPassword: sipPassword.trim(),
      providerName: providerName?.trim() || undefined,
    });

    return {
      success: true,
      data: { didNumber: result.phoneNumber },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import SIP number";
    return { success: false, error: message };
  }
}

/**
 * Imports an existing carrier number that forwards to a BYO SIP DID.
 * Same as importSipPhoneNumber but also stores the carrier's business number.
 */
export async function importCarrierNumber(
  agentId: string,
  carrierNumber: string,
  didNumber: string,
  sipServer: string,
  sipUsername: string,
  sipPassword: string,
  providerName?: string,
): Promise<{ success: true; data: { didNumber: string; carrierNumber: string } } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const parsedCarrier = moroccanE164Schema.safeParse(carrierNumber);
    if (!parsedCarrier.success) {
      return {
        success: false,
        error: "Invalid carrier phone number: " + (parsedCarrier.error.issues[0]?.message ?? ""),
      };
    }

    const existingCarrier = await prisma.twilioPhoneNumber.findFirst({
      where: {
        customerNumber: parsedCarrier.data,
        isActive: true,
      },
      select: { orgId: true },
    });
    if (existingCarrier) {
      return {
        success: false,
        error:
          existingCarrier.orgId === orgId
            ? "This business number is already connected to an agent in your organization."
            : "This business number is already connected to another organization.",
      };
    }

    const result = await importSipNumber(orgId, agentId, {
      didNumber,
      sipServer,
      sipUsername,
      sipPassword,
      providerName,
      customerNumber: parsedCarrier.data,
    });

    return {
      success: true,
      data: {
        didNumber: result.phoneNumber,
        carrierNumber: parsedCarrier.data,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import carrier number";
    return { success: false, error: message };
  }
}

// ── Moroccan Number Auto-Provisioning (DIDWW) ─────────────────────────────

export type MoroccanProvisionResult = {
  phoneNumber: string;
};

/**
 * Auto-provision a Moroccan phone number for an agent.
 * Zero-friction: user clicks "Get a Number", backend handles everything.
 * 1. Validates org + plan limits
 * 2. Buys DID from DIDWW
 * 3. Creates Vapi BYO SIP credentials
 * 4. Registers number with Vapi
 * 5. Saves to DB
 */
export async function getMoroccanNumber(
  agentId: string,
): Promise<
  { success: true; data: MoroccanProvisionResult } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    const plan = org?.plan ?? "FREE";
    const maxNumbers = MAX_PHONE_NUMBERS[plan];

    const currentCount = await pbxmeCountNumbers(orgId);
    if (currentCount >= maxNumbers) {
      return {
        success: false,
        error: `You've reached the maximum number of phone numbers for your ${plan} plan. Upgrade to add more.`,
      };
    }

    const result = await provisionNumber(orgId, agentId);

    return {
      success: true,
      data: { phoneNumber: result.phoneNumber },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to provision Moroccan number";
    return { success: false, error: message };
  }
}

/**
 * Disconnect a phone number (DIDWW-managed or BYO SIP).
 */
export async function disconnectPhoneNumberV2(
  phoneNumber: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    // Try DIDWW release first (for managed numbers)
    const mapping = await prisma.twilioPhoneNumber.findUnique({
      where: { twilioNumber: normalizeE164(phoneNumber) },
      select: { didwwNumberId: true },
    });

    if (mapping?.didwwNumberId) {
      const result = await pbxmeReleaseNumber(orgId, phoneNumber);
      if (!result.success) {
        return { success: false, error: result.error ?? "Failed to disconnect phone number" };
      }
      return { success: true };
    }

    // Fall back to BYO SIP release
    const result = await releasePhoneNumber(orgId, phoneNumber);
    if (!result.success) {
      return { success: false, error: result.error ?? "Failed to disconnect phone number" };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disconnect phone number";
    return { success: false, error: message };
  }
}
