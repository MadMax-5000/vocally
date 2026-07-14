"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  provisionPhoneNumber,
  releasePhoneNumber,
  countOrgPhoneNumbers,
} from "@/lib/twilio/provision-number";
import { MAX_PHONE_NUMBERS } from "@/lib/billing/plan-features";

const e164Schema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, ""))
  .refine((v) => /^\+[1-9]\d{6,14}$/.test(v), {
    message: "Enter a valid phone number in E.164 format (e.g. +212612345678)",
  });

export type PhoneConnectionSettings = {
  numbers: Array<{
    id: string;
    number: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  maxNumbers: number;
  currentCount: number;
};

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
          isActive: n.isActive,
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

/**
 * Provisions a new Moroccan phone number from Telnyx
 * and registers it in Vapi as a BYO phone number.
 */
export async function connectPhoneNumber(
  agentId: string,
): Promise<{ success: true; data: { number: string } } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    // Check plan limits
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

    // Provision a new number from Telnyx + register in Vapi
    const result = await provisionPhoneNumber(orgId, agentId);

    return { success: true, data: { number: result.phoneNumber } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to provision phone number";
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

export type CarrierImportResult = {
  didNumber: string;
  carrierNumber: string;
};

/**
 * Imports a carrier-bought phone number by provisioning a number from Telnyx,
 * registering it in Vapi, and storing the carrier number for forwarding setup.
 *
 * Flow:
 * 1. Validate carrier number (E.164)
 * 2. Check plan limits
 * 3. Provision a number from Telnyx + register in Vapi
 * 4. Store carrier number as customerNumber
 * 5. Return both numbers (UI shows USSD forwarding instructions)
 */
export async function importCarrierNumber(
  agentId: string,
  carrierNumber: string,
): Promise<{ success: true; data: CarrierImportResult } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const parsed = e164Schema.safeParse(carrierNumber);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid phone number",
      };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    // Check plan limits
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

    // Provision a number from Telnyx + register in Vapi
    const result = await provisionPhoneNumber(orgId, agentId);

    // Update the record with the carrier number
    await prisma.twilioPhoneNumber.update({
      where: { twilioNumber: result.phoneNumber },
      data: { customerNumber: parsed.data },
    });

    return {
      success: true,
      data: {
        didNumber: result.phoneNumber,
        carrierNumber: parsed.data,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import carrier number";
    return { success: false, error: message };
  }
}
