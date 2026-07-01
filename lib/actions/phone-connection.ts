"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { getTwilioVoiceNumber } from "@/lib/twilio/env";

export type PhoneConnectionSettings = {
  /** The customer's own phone number (the one they forward FROM), e.g. +2126XXXXXXXX */
  customerNumber: string | null;
  /** The Vocally Twilio number that calls forward TO */
  forwardingNumber: string;
  /** Whether the forwarding is active */
  isActive: boolean;
  /** The TwilioPhoneNumber record id, if one exists */
  connectionId: string | null;
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

    const connection = await prisma.twilioPhoneNumber.findFirst({
      where: { orgId, agentId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        customerNumber: connection?.customerNumber ?? null,
        forwardingNumber: getTwilioVoiceNumber(),
        isActive: connection?.isActive ?? false,
        connectionId: connection?.id ?? null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setupPhoneForwarding(
  agentId: string,
  customerNumber: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const forwardingNumber = getTwilioVoiceNumber();

    // Ensure the Vocally forwarding number exists in the DB, upsert with customer number
    await prisma.twilioPhoneNumber.upsert({
      where: { twilioNumber: forwardingNumber },
      update: { agentId, orgId, isActive: true, customerNumber },
      create: {
        twilioNumber: forwardingNumber,
        orgId,
        agentId,
        isActive: true,
        customerNumber,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function disconnectPhoneForwarding(
  agentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const forwardingNumber = getTwilioVoiceNumber();

    await prisma.twilioPhoneNumber.updateMany({
      where: { orgId, agentId, twilioNumber: forwardingNumber },
      data: { isActive: false, agentId: null, customerNumber: null },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
