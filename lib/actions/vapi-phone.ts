"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

export type AgentPhoneSettings = {
  numbers: Array<{
    id: string;
    number: string;
    vapiPhoneNumberId?: string | null;
  }>;
};

export async function getAgentPhoneSettings(agentId: string): Promise<{ success: boolean; data?: AgentPhoneSettings; error?: string }> {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  try {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const numbers = await prisma.twilioPhoneNumber.findMany({
      where: { orgId, agentId }
    });

    // In a real implementation we might also store vapiPhoneNumberId in the db.
    return {
      success: true,
      data: {
        numbers: numbers.map(n => ({
          id: n.id,
          number: n.twilioNumber,
        }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importTwilioNumberToVapi(agentId: string, number: string): Promise<{ success: boolean; error?: string }> {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

  if (!VAPI_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { success: false, error: "Missing required Vapi or Twilio environment variables." };
  }

  // Find or create in our DB first to verify ownership
  // Real implementation should verify Twilio ownership first
  const existing = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber: number }
  });

  if (existing && existing.orgId !== orgId) {
    return { success: false, error: "Number is already registered to another organization." };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.vocally.ma";
    const response = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        provider: "twilio",
        number: number,
        twilioAccountSid: TWILIO_ACCOUNT_SID,
        twilioAuthToken: TWILIO_AUTH_TOKEN,
        serverUrl: `${appUrl}/api/webhooks/vapi`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Vapi import failed: ${errorText}` };
    }

    // Upsert local mapping
    await prisma.twilioPhoneNumber.upsert({
      where: { twilioNumber: number },
      update: { agentId, isActive: true },
      create: {
        twilioNumber: number,
        orgId,
        agentId,
        isActive: true,
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
