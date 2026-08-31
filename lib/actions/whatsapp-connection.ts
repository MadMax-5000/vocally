"use server";

import { revalidatePath } from "next/cache";
import { AgentStatus, AgentVisibility, WhatsappConnectionStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  formatWhatsappDisplay,
  isLegacyWhatsappConnection,
  isTwilioPlatformConfigured,
  isWhatsappConnectAvailable,
  isWhatsappEmbeddedSignupConfigured,
  isWhatsappSandboxMode,
} from "@/lib/deploy/whatsapp-config";
import { disconnectWhatsappForAgent } from "@/lib/integrations/whatsapp/connect";
import { getOrgPrismaId } from "@/lib/server/organization";

export type AgentWhatsAppSettings = {
  platformConfigured: boolean;
  embeddedSignupConfigured: boolean;
  sandboxMode: boolean;
  connectAvailable: boolean;
  connection: {
    id: string;
    twilioNumber: string;
    connectedAt: Date;
    isActive: boolean;
    status: WhatsappConnectionStatus;
    statusMessage: string | null;
    twilioSenderSid: string | null;
    qualityRating: string | null;
    messagingLimit: string | null;
    isLegacy: boolean;
  } | null;
  readiness: {
    channelEnabled: boolean;
    agentActive: boolean;
    agentPublic: boolean;
    connectionOnline: boolean;
    platformConfigured: boolean;
  };
};

function revalidateWhatsAppDeploy(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}/deploy/whatsapp`);
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function getAgentWhatsAppSettings(agentId: string): Promise<
  | { success: true; data: AgentWhatsAppSettings }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: {
        id: true,
        status: true,
        visibility: true,
        channels: { where: { channel: "WHATSAPP" }, select: { enabled: true } },
      },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const [connection, zernioChannel] = await Promise.all([
      prisma.whatsappPhoneNumber.findFirst({
        where: { orgId, agentId, isActive: true },
        select: {
          id: true,
          twilioNumber: true,
          createdAt: true,
          isActive: true,
          status: true,
          statusMessage: true,
          twilioSenderSid: true,
          qualityRating: true,
          messagingLimit: true,
        },
      }),
      prisma.zernioChannel.findFirst({
        where: { agentId, orgId, channelType: "WHATSAPP" },
        select: { id: true },
      }),
    ]);

    const channelEnabled = agent.channels.some((c) => c.enabled);
    const platformConfigured =
      isTwilioPlatformConfigured() || Boolean(process.env.ZERNIO_API_KEY?.trim());
    const twilioOnline =
      Boolean(connection?.isActive) &&
      (connection?.status === "ONLINE" || isLegacyWhatsappConnection(connection));
    const connectionOnline = Boolean(zernioChannel) || twilioOnline;

    return {
      success: true,
      data: {
        platformConfigured,
        embeddedSignupConfigured: isWhatsappEmbeddedSignupConfigured(),
        sandboxMode: isWhatsappSandboxMode(),
        connectAvailable: isWhatsappConnectAvailable(),
        connection: connection
          ? {
              id: connection.id,
              twilioNumber: formatWhatsappDisplay(connection.twilioNumber),
              connectedAt: connection.createdAt,
              isActive: connection.isActive,
              status: connection.status,
              statusMessage: connection.statusMessage,
              twilioSenderSid: connection.twilioSenderSid,
              qualityRating: connection.qualityRating,
              messagingLimit: connection.messagingLimit,
              isLegacy: isLegacyWhatsappConnection(connection),
            }
          : null,
        readiness: {
          channelEnabled,
          agentActive: agent.status === AgentStatus.ACTIVE,
          agentPublic: agent.visibility === AgentVisibility.PUBLIC,
          connectionOnline,
          platformConfigured,
        },
      },
    };
  } catch {
    return { success: false, error: "Could not load WhatsApp settings" };
  }
}

export async function disconnectWhatsAppForAgent(
  agentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    await disconnectWhatsappForAgent({ orgId, agentId });
    revalidateWhatsAppDeploy(agentId);
    return { success: true };
  } catch {
    return { success: false, error: "Could not disconnect WhatsApp" };
  }
}
