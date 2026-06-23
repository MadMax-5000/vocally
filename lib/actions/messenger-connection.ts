"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { decryptToken } from "@/lib/crypto/token-encryption";
import { disconnectMessengerForAgent } from "@/lib/meta/connect";
import { getOrgPrismaId } from "@/lib/server/organization";

export type AgentMessengerSettings = {
  connection: {
    pageId: string;
    pageName: string | null;
    connectedAt: Date;
    webhookVerifyToken: string;
  } | null;
};

function revalidateMessengerDeploy(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}/deploy/messenger`);
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function getAgentMessengerSettings(agentId: string): Promise<
  | { success: true; data: AgentMessengerSettings }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const connection = await prisma.messengerConnection.findFirst({
      where: { agentId, orgId },
      select: { pageId: true, pageName: true, connectedAt: true, verifyTokenEnc: true },
    });

    return {
      success: true,
      data: {
        connection: connection
          ? {
              pageId: connection.pageId,
              pageName: connection.pageName ?? null,
              connectedAt: connection.connectedAt,
              webhookVerifyToken: decryptToken(connection.verifyTokenEnc),
            }
          : null,
      },
    };
  } catch {
    return { success: false, error: "Could not load Messenger settings" };
  }
}

export async function disconnectMessenger(agentId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false as const, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false as const, error: "Agent not found" };

    await disconnectMessengerForAgent({ orgId, agentId });
    revalidateMessengerDeploy(agentId);
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Could not disconnect Messenger" };
  }
}

