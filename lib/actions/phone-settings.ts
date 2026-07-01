"use server";

import { prisma } from "@/lib/db/prisma";
import { resolveEscalationAction } from "@/lib/deploy/escalation-action";
import { getOrgPrismaId } from "@/lib/server/organization";

export type PhoneSettings = {
  greeting: string;
  language: string;
  bargeIn: boolean;
  timeout: number;
  voicemailDetection: boolean;
  handoffPhone: string;
  escalationsEnabled: boolean;
};

const DEFAULT_GREETING = "Hi, you've reached {agentName}. How can I help you today?";
const DEFAULT_SETTINGS: PhoneSettings = {
  greeting: DEFAULT_GREETING,
  language: "auto",
  bargeIn: true,
  timeout: 15,
  voicemailDetection: false,
  handoffPhone: "",
  escalationsEnabled: false,
};

export async function getPhoneSettings(
  agentId: string,
): Promise<{ success: true; data: PhoneSettings; agentName: string } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: {
        id: true,
        name: true,
        handoffEnabled: true,
        channels: { select: { channel: true, enabled: true, config: true } },
      },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const channel = await prisma.agentChannel.findUnique({
      where: { agentId_channel: { agentId, channel: "VOICE_CALLS" } },
      select: { config: true },
    });

    const config = (channel?.config ?? {}) as Record<string, unknown>;
    const escalation = resolveEscalationAction(agent.channels);

    return {
      success: true,
      agentName: agent.name,
      data: {
        greeting: (config.greeting as string) ?? DEFAULT_SETTINGS.greeting,
        language: (config.language as string) ?? DEFAULT_SETTINGS.language,
        bargeIn: (config.bargeIn as boolean) ?? DEFAULT_SETTINGS.bargeIn,
        timeout: (config.timeout as number) ?? DEFAULT_SETTINGS.timeout,
        voicemailDetection:
          (config.voicemailDetection as boolean) ?? DEFAULT_SETTINGS.voicemailDetection,
        handoffPhone: (config.handoffPhone as string) ?? "",
        escalationsEnabled: agent.handoffEnabled && escalation.enabled,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load phone settings";
    return { success: false, error: message };
  }
}

export async function updatePhoneSettings(
  agentId: string,
  settings: Partial<PhoneSettings>,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true, name: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    // Merge with existing config
    const existing = await prisma.agentChannel.findUnique({
      where: { agentId_channel: { agentId, channel: "VOICE_CALLS" } },
      select: { config: true },
    });

    const currentConfig = (existing?.config ?? {}) as Record<string, unknown>;
    const { escalationsEnabled: _ignored, ...voiceSettings } = settings;
    const mergedConfig = { ...currentConfig, ...voiceSettings };
    if (typeof mergedConfig.handoffPhone === "string") {
      mergedConfig.handoffPhone = mergedConfig.handoffPhone.trim();
    }

    await prisma.agentChannel.upsert({
      where: { agentId_channel: { agentId, channel: "VOICE_CALLS" } },
      update: { config: mergedConfig },
      create: {
        agentId,
        channel: "VOICE_CALLS",
        enabled: true,
        config: mergedConfig,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save phone settings";
    return { success: false, error: message };
  }
}
