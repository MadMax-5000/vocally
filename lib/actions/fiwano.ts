"use server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { revalidatePath } from "next/cache";

export async function saveFiwanoChannel(
  agentId: string,
  channelId: string,
  channelType: "INSTAGRAM" | "MESSENGER",
) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false, error: "Unauthorized" };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) return { success: false, error: "Agent not found" };

  await prisma.fiwanoChannel.upsert({
    where: { channelId },
    update: { agentId, orgId, channelType },
    create: { channelId, agentId, orgId, channelType },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  return { success: true };
}

export async function getFiwanoChannelsForAgent(agentId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  const channels = await prisma.fiwanoChannel.findMany({
    where: { agentId, orgId },
    select: { channelId: true, channelType: true, createdAt: true },
  });

  return { success: true as const, data: channels };
}

export async function removeFiwanoChannel(agentId: string, channelId: string) {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { success: false as const, error: "Unauthorized" };

  await prisma.fiwanoChannel.deleteMany({
    where: { channelId, agentId, orgId },
  });

  revalidatePath(`/dashboard/agents/${agentId}/deploy/instagram`);
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  return { success: true as const };
}
