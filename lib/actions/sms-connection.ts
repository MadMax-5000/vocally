"use server";

import { revalidatePath } from "next/cache";
import { AgentStatus, AgentVisibility } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import {
  e164PhoneSchema,
  getAppOrigin,
  getSuggestedSmsNumber,
  getSmsWebhookUrl,
  isTwilioPlatformConfigured,
} from "@/lib/deploy/sms-config";
import { getOrgPrismaId } from "@/lib/server/organization";

export type AgentSmsSettings = {
  platformConfigured: boolean;
  suggestedNumber: string | null;
  webhookUrl: string;
  connection: {
    id: string;
    twilioNumber: string;
    connectedAt: Date;
    isActive: boolean;
  } | null;
  readiness: {
    channelEnabled: boolean;
    agentActive: boolean;
    agentPublic: boolean;
    mappingActive: boolean;
    platformConfigured: boolean;
  };
};

const connectSchema = z.object({
  phoneNumber: e164PhoneSchema,
});

function revalidateSmsDeploy(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}/deploy/sms`);
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function getAgentSmsSettings(agentId: string): Promise<
  | { success: true; data: AgentSmsSettings }
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
        channels: { where: { channel: "SMS" }, select: { enabled: true } },
      },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const connection = await prisma.smsPhoneNumber.findFirst({
      where: { orgId, agentId, isActive: true },
      select: { id: true, twilioNumber: true, createdAt: true, isActive: true },
    });

    const channelEnabled = agent.channels.some((c) => c.enabled);
    const platformConfigured = isTwilioPlatformConfigured();

    return {
      success: true,
      data: {
        platformConfigured,
        suggestedNumber: getSuggestedSmsNumber(),
        webhookUrl: getSmsWebhookUrl(),
        connection: connection
          ? {
              id: connection.id,
              twilioNumber: connection.twilioNumber,
              connectedAt: connection.createdAt,
              isActive: connection.isActive,
            }
          : null,
        readiness: {
          channelEnabled,
          agentActive: agent.status === AgentStatus.ACTIVE,
          agentPublic: agent.visibility === AgentVisibility.PUBLIC,
          mappingActive: Boolean(connection?.isActive),
          platformConfigured,
        },
      },
    };
  } catch {
    return { success: false, error: "Could not load SMS settings" };
  }
}

export async function connectSmsForAgent(
  agentId: string,
  input: { phoneNumber: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    if (!isTwilioPlatformConfigured()) {
      return {
        success: false,
        error: "Twilio is not configured on this deployment. Contact your administrator.",
      };
    }

    const parsed = connectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid phone number" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const twilioNumber = parsed.data.phoneNumber;

    const existing = await prisma.smsPhoneNumber.findUnique({
      where: { twilioNumber },
    });

    if (existing && existing.orgId !== orgId) {
      return {
        success: false,
        error: "This number is already registered to another organization.",
      };
    }

    if (existing) {
      await prisma.smsPhoneNumber.update({
        where: { id: existing.id },
        data: { orgId, agentId, isActive: true },
      });
    } else {
      await prisma.smsPhoneNumber.create({
        data: { orgId, agentId, twilioNumber, isActive: true },
      });
    }

    revalidateSmsDeploy(agentId);
    return { success: true };
  } catch {
    return { success: false, error: "Could not connect SMS number" };
  }
}

export async function disconnectSmsForAgent(
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

    await prisma.smsPhoneNumber.deleteMany({
      where: { orgId, agentId },
    });

    revalidateSmsDeploy(agentId);
    return { success: true };
  } catch {
    return { success: false, error: "Could not disconnect SMS number" };
  }
}
