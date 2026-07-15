"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { revalidatePath } from "next/cache";

export async function saveZernioChannel(
  agentId: string,
  accountId: string,
  channelType: "INSTAGRAM" | "MESSENGER",
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

export async function removeZernioChannel(agentId: string, accountId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  await prisma.zernioChannel.deleteMany({
    where: { accountId, agentId, orgId },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  return { success: true as const };
}
