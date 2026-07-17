"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import {
  getEmailChannelConfig,
  isEmailChannelEnabled,
  type EmailChannelConfig,
} from "@/lib/deploy/email-channel-config";
import { disconnectGmailForAgent } from "@/lib/gmail/connect";
import { getGmailClientForAgent } from "@/lib/gmail/client";
import { formatGmailApiError, listGmailLabels, type GmailLabelOption } from "@/lib/gmail/labels";
import { appendSignature, sendGmailMessage } from "@/lib/gmail/send";
import { logServerError } from "@/lib/logger";
import { getOrgPrismaId, getOrgPlan } from "@/lib/server/organization";
import { EMAIL_CHANNEL_ENABLED } from "@/lib/billing/plan-features";

export type { GmailLabelOption };

export type AgentGmailSettings = {
  connection: {
    googleEmail: string;
    connectedAt: Date;
    watchExpiration: Date | null;
    labelIds: string[];
  } | null;
  emailEnabled: boolean;
  emailConfig: EmailChannelConfig;
};

const updateEmailSettingsSchema = z.object({
  signature: z.string().max(2000).optional(),
  replySubjectPrefix: z.string().max(20).optional(),
  autoReplyEnabled: z.boolean().optional(),
  labelIds: z.array(z.string().max(64)).min(1).max(10).optional(),
});

function revalidateEmailDeploy(agentId: string) {
  revalidatePath(`/dashboard/agents/${agentId}/deploy/email`);
  revalidatePath(`/dashboard/agents/${agentId}`);
}

export async function getAgentGmailSettings(agentId: string): Promise<
  | { success: true; data: AgentGmailSettings }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return { success: false, error: "Unauthorized" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      include: {
        channels: true,
        gmailConnection: true,
      },
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    const connection = agent.gmailConnection;
    const labelIds =
      connection?.labelIds && Array.isArray(connection.labelIds)
        ? (connection.labelIds as string[])
        : ["INBOX"];

    return {
      success: true,
      data: {
        connection: connection
          ? {
              googleEmail: connection.googleEmail,
              connectedAt: connection.connectedAt,
              watchExpiration: connection.watchExpiration,
              labelIds,
            }
          : null,
        emailEnabled: isEmailChannelEnabled(agent.channels),
        emailConfig: getEmailChannelConfig(agent.channels),
      },
    };
  } catch {
    return { success: false, error: "Could not load Gmail settings" };
  }
}

export async function getGmailLabelOptions(agentId: string): Promise<
  | { success: true; data: GmailLabelOption[] }
  | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const connection = await prisma.gmailConnection.findFirst({
      where: { agentId, orgId },
      select: { id: true },
    });
    if (!connection) {
      return { success: false, error: "Connect Gmail first" };
    }

    const labels = await listGmailLabels(agentId, orgId);
    return { success: true, data: labels };
  } catch (e) {
    return {
      success: false,
      error: formatGmailApiError(e) || "Could not load Gmail labels",
    };
  }
}

async function ensurePlanAllowsEmail(orgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org || !EMAIL_CHANNEL_ENABLED[org.plan as keyof typeof EMAIL_CHANNEL_ENABLED]) {
    return "Email channel is not available on your plan. Upgrade to continue.";
  }
  return null;
}

export async function disconnectGmail(agentId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const planError = await ensurePlanAllowsEmail(orgId);
    if (planError) return { success: false, error: planError };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    await disconnectGmailForAgent(agentId, orgId);
    revalidateEmailDeploy(agentId);
    return { success: true };
  } catch {
    return { success: false, error: "Could not disconnect Gmail" };
  }
}

export async function updateEmailChannelSettings(
  agentId: string,
  input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const planError = await ensurePlanAllowsEmail(orgId);
    if (planError) return { success: false, error: planError };

    const parsed = updateEmailSettingsSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { success: false, error: first?.message ?? "Invalid input" };
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) return { success: false, error: "Agent not found" };

    const existing = await prisma.agentChannel.findUnique({
      where: { agentId_channel: { agentId, channel: "EMAIL" } },
    });

    const existingConfig =
      existing?.config &&
      typeof existing.config === "object" &&
      !Array.isArray(existing.config)
        ? (existing.config as Record<string, unknown>)
        : {};

    const currentEmail =
      existingConfig.email &&
      typeof existingConfig.email === "object" &&
      !Array.isArray(existingConfig.email)
        ? { ...(existingConfig.email as Record<string, unknown>) }
        : {};

    const incoming = parsed.data;
    if (incoming.signature !== undefined) {
      currentEmail.signature = incoming.signature;
    }
    if (incoming.replySubjectPrefix !== undefined) {
      currentEmail.replySubjectPrefix = incoming.replySubjectPrefix;
    }
    if (incoming.autoReplyEnabled !== undefined) {
      currentEmail.autoReplyEnabled = incoming.autoReplyEnabled;
    }

    const nextConfig = {
      ...existingConfig,
      email: currentEmail,
    } as Prisma.InputJsonValue;

    await prisma.agentChannel.upsert({
      where: { agentId_channel: { agentId, channel: "EMAIL" } },
      create: {
        agentId,
        channel: "EMAIL",
        enabled: existing?.enabled ?? true,
        config: nextConfig,
      },
      update: { config: nextConfig },
    });

    if (incoming.labelIds) {
      const gmail = await prisma.gmailConnection.findFirst({
        where: { agentId, orgId },
      });
      if (gmail) {
        try {
          const { startGmailWatch } = await import("@/lib/gmail/watch");
          await startGmailWatch(agentId, orgId, incoming.labelIds);
        } catch (watchErr) {
          logServerError("email_settings_watch_failed", {
            agentId,
            error: formatGmailApiError(watchErr),
          });
          return {
            success: false as const,
            error: `Could not update mailbox watch: ${formatGmailApiError(watchErr)}. Pick valid labels from the list.`,
          };
        }
      }
    }

    revalidateEmailDeploy(agentId);
    return { success: true };
  } catch (e) {
    logServerError("email_settings_save_failed", {
      agentId,
      error: formatGmailApiError(e),
    });
    return {
      success: false,
      error: formatGmailApiError(e) || "Could not save email settings",
    };
  }
}

export async function sendGmailTestEmail(agentId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const orgId = await getOrgPrismaId();
    if (!orgId) return { success: false, error: "Unauthorized" };

    const planError = await ensurePlanAllowsEmail(orgId);
    if (planError) return { success: false, error: planError };

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      include: { channels: true, gmailConnection: true },
    });
    if (!agent?.gmailConnection) {
      return { success: false, error: "Connect Gmail first" };
    }

    const { gmail } = await getGmailClientForAgent(agentId, orgId);
    const emailConfig = getEmailChannelConfig(agent.channels);
    const to = agent.gmailConnection.googleEmail;
    const subject = "Anselio Gmail test";
    const body = appendSignature(
      "This is a test message from your Anselio agent. Gmail send is working.",
      emailConfig.signature,
    );

    await sendGmailMessage(gmail, {
      from: to,
      to,
      subject,
      body,
    });

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send test email";
    return { success: false, error: msg };
  }
}
