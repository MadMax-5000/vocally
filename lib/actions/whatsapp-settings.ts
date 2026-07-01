"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  DEFAULT_WHATSAPP_CHANNEL_CONFIG,
  parseWhatsappChannelConfig,
  type WhatsappChannelConfig,
  whatsappChannelConfigSchema,
} from "@/lib/deploy/whatsapp-channel-config";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

function revalidateWhatsAppDeploy(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
}

export async function getWhatsappSettings(
  agentId: string,
): Promise<
  | { success: true; data: WhatsappChannelConfig; agentName: string }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true, name: true, handoffEnabled: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const channel = await prisma.agentChannel.findUnique({
      where: { agentId_channel: { agentId, channel: "WHATSAPP" } },
      select: { config: true },
    });

    const config = parseWhatsappChannelConfig(channel?.config);
    if (config.handoffEnabled === undefined) {
      config.handoffEnabled = agent.handoffEnabled;
    }

    return { success: true, agentName: agent.name, data: config };
  } catch {
    return { success: false, error: "Could not load WhatsApp settings" };
  }
}

export async function updateWhatsappSettings(
  agentId: string,
  input: Partial<WhatsappChannelConfig>,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const parsed = whatsappChannelConfigSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const existing = await prisma.agentChannel.findUnique({
      where: { agentId_channel: { agentId, channel: "WHATSAPP" } },
      select: { config: true, enabled: true },
    });

    const current = parseWhatsappChannelConfig(existing?.config);
    const merged = { ...current, ...parsed.data };

    await prisma.agentChannel.upsert({
      where: { agentId_channel: { agentId, channel: "WHATSAPP" } },
      create: {
        agentId,
        channel: "WHATSAPP",
        enabled: true,
        config: merged as Prisma.InputJsonValue,
      },
      update: { config: merged as Prisma.InputJsonValue, enabled: true },
    });

    revalidateWhatsAppDeploy(agentId);
    return { success: true };
  } catch {
    return { success: false, error: "Could not save WhatsApp settings" };
  }
}

export { DEFAULT_WHATSAPP_CHANNEL_CONFIG };
