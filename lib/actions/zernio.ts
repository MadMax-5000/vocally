"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { revalidatePath } from "next/cache";
import { listZernioAccounts } from "@/lib/zernio/client";

export async function saveZernioChannel(
  agentId: string,
  accountId: string,
  channelType: "INSTAGRAM" | "MESSENGER" | "WHATSAPP",
  platformUsername?: string,
) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) return { success: false, error: "Agent not found" };

  await prisma.zernioChannel.upsert({
    where: { accountId },
    update: { agentId, orgId, channelType, platformUsername },
    create: { accountId, agentId, orgId, channelType, platformUsername },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
  return { success: true };
}

export async function getZernioChannelsForAgent(agentId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  const channels = await prisma.zernioChannel.findMany({
    where: { agentId, orgId },
    select: { accountId: true, channelType: true, platformUsername: true, connectedAt: true },
  });

  return { success: true as const, data: channels };
}

export async function getAvailableZernioAccounts(
  platform: "instagram" | "facebook" | "whatsapp",
) {
  try {
    const accounts = await listZernioAccounts(platform);
    return { success: true as const, data: accounts };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return { success: false as const, error: message };
  }
}

export async function removeZernioChannel(agentId: string, accountId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  await prisma.zernioChannel.deleteMany({
    where: { accountId, agentId, orgId },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
  return { success: true as const };
}
