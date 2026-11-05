"use server";

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAppOrigin } from "@/lib/app-url";
import { encryptToken } from "@/lib/crypto/token-encryption";
import { prisma } from "@/lib/db/prisma";
import {
  createHostawayWebhook,
  deleteHostawayWebhook,
  verifyHostawayCredentials,
} from "@/lib/hostaway/client";
import { HOSTAWAY_SUPPORTED_CHANNELS } from "@/lib/hostaway/channels";
import { HostawayError } from "@/lib/hostaway/errors";
import { getHostawayAccessToken, revokeHostawayAccessToken } from "@/lib/hostaway/auth";
import { logServerError, logServerWarning } from "@/lib/logger";
import { getOrgPrismaId } from "@/lib/server/organization";

export type HostawayConnectionSettings = {
  accountId: string;
  agentId: string;
  connectedAt: string;
  autoReplyEnabled: boolean;
  escalationEmail: string | null;
  webhookConfigured: boolean;
  webhookUrl: string;
  lastError: string | null;
  lastErrorAt: string | null;
};

export type HostawaySettings = {
  connection: HostawayConnectionSettings | null;
  supportedChannels: Array<{ id: string; label: string }>;
};

const emailField = z.union([z.string().trim().email().max(320), z.literal("")]);

const connectHostawaySchema = z.object({
  accountId: z
    .string()
    .trim()
    .regex(/^\d{1,20}$/, "Account ID must be numeric"),
  apiKey: z.string().trim().min(8).max(512),
  escalationEmail: emailField.optional(),
});

export type ConnectHostawayInput = z.infer<typeof connectHostawaySchema>;

const updateHostawaySettingsSchema = z.object({
  autoReplyEnabled: z.boolean().optional(),
  escalationEmail: emailField.optional(),
});

export type UpdateHostawaySettingsInput = z.infer<
  typeof updateHostawaySettingsSchema
>;

function toSettings(connection: {
  id: string;
  accountId: string;
  agentId: string;
  lastConnectedAt: Date;
  autoReplyEnabled: boolean;
  escalationEmail: string | null;
  webhookId: string | null;
  lastError: string | null;
  lastErrorAt: Date | null;
}): HostawaySettings["connection"] {
  return {
    accountId: connection.accountId,
    agentId: connection.agentId,
    connectedAt: connection.lastConnectedAt.toISOString(),
    autoReplyEnabled: connection.autoReplyEnabled,
    escalationEmail: connection.escalationEmail,
    webhookConfigured: Boolean(connection.webhookId),
    webhookUrl: `${getAppOrigin()}/api/webhooks/hostaway?connection=${connection.id}`,
    lastError: connection.lastError,
    lastErrorAt: connection.lastErrorAt?.toISOString() ?? null,
  };
}

function mapHostawayError(err: unknown): string {
  if (err instanceof HostawayError) {
    if (err.status === 401 || err.status === 403) {
      return "Hostaway rejected the Account ID or API key.";
    }
    if (err.status === 429) {
      return "Hostaway rate limit reached. Wait a minute and try again.";
    }
    return err.message;
  }
  if (err instanceof Error && err.message.includes("TOKEN_ENCRYPTION_KEY")) {
    return "Server token encryption is not configured. Contact support.";
  }
  return "Could not reach Hostaway. Try again.";
}

async function requireAgent(
  agentId: string,
): Promise<{ agent: { id: string; orgId: string } } | { error: string }> {
  const orgId = await getOrgPrismaId();
  if (!orgId) return { error: "Unauthorized" };

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true, orgId: true },
  });
  if (!agent) return { error: "Agent not found" };

  return { agent };
}

export async function getHostawaySettings(
  agentId: string,
): Promise<{ success: true; data: HostawaySettings } | { success: false; error: string }> {
  const resolved = await requireAgent(agentId);
  if ("error" in resolved) return { success: false, error: resolved.error };

  const connection = await prisma.hostawayConnection.findUnique({
    where: { agentId },
    select: {
      id: true,
      accountId: true,
      agentId: true,
      lastConnectedAt: true,
      autoReplyEnabled: true,
      escalationEmail: true,
      webhookId: true,
      lastError: true,
      lastErrorAt: true,
    },
  });

  return {
    success: true,
    data: {
      connection: connection ? toSettings(connection) : null,
      supportedChannels: HOSTAWAY_SUPPORTED_CHANNELS.map((channel) => ({
        id: channel.id,
        label: channel.label,
      })),
    },
  };
}

export async function connectHostaway(
  agentId: string,
  input: ConnectHostawayInput,
): Promise<
  { success: true; data: HostawaySettings } | { success: false; error: string }
> {
  const resolved = await requireAgent(agentId);
  if ("error" in resolved) return { success: false, error: resolved.error };
  const { agent } = resolved;

  const parsed = connectHostawaySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid Hostaway credentials",
    };
  }

  const { accountId, apiKey, escalationEmail } = parsed.data;

  try {
    const conflicting = await prisma.hostawayConnection.findUnique({
      where: { accountId },
      select: { agentId: true },
    });
    if (conflicting && conflicting.agentId !== agentId) {
      return {
        success: false,
        error: "This Hostaway account is already connected to another agent.",
      };
    }

    const existing = await prisma.hostawayConnection.findUnique({
      where: { agentId },
      select: {
        id: true,
        accountId: true,
        webhookId: true,
        autoReplyEnabled: true,
      },
    });

    const minted = await verifyHostawayCredentials({ accountId, apiKey });

    const connectionId = existing?.id ?? crypto.randomUUID();
    const webhookLogin = `anselio_${randomBytes(8).toString("hex")}`;
    const webhookPassword = randomBytes(24).toString("base64url");
    const webhookUrl = `${getAppOrigin()}/api/webhooks/hostaway?connection=${connectionId}`;

    const webhook = await createHostawayWebhook(minted.accessToken, {
      url: webhookUrl,
      login: webhookLogin,
      password: webhookPassword,
      alertingEmailAddress: escalationEmail || undefined,
    });

    try {
      await prisma.hostawayConnection.upsert({
        where: { agentId },
        create: {
          id: connectionId,
          orgId: agent.orgId,
          agentId,
          accountId,
          apiKeyEnc: encryptToken(apiKey),
          accessTokenEnc: encryptToken(minted.accessToken),
          accessTokenExpiresAt: minted.expiresAt,
          webhookId: String(webhook.id),
          webhookLogin,
          webhookPasswordEnc: encryptToken(webhookPassword),
          webhookRegisteredAt: new Date(),
          autoReplyEnabled: true,
          escalationEmail: escalationEmail || null,
        },
        update: {
          accountId,
          apiKeyEnc: encryptToken(apiKey),
          accessTokenEnc: encryptToken(minted.accessToken),
          accessTokenExpiresAt: minted.expiresAt,
          webhookId: String(webhook.id),
          webhookLogin,
          webhookPasswordEnc: encryptToken(webhookPassword),
          webhookRegisteredAt: new Date(),
          escalationEmail: escalationEmail || null,
          lastConnectedAt: new Date(),
          lastError: null,
          lastErrorAt: null,
        },
      });
    } catch (err) {
      await deleteHostawayWebhook(minted.accessToken, webhook.id).catch(() => undefined);
      throw err;
    }

    await prisma.agentChannel.upsert({
      where: { agentId_channel: { agentId, channel: "HOSTAWAY" } },
      create: { agentId, channel: "HOSTAWAY", enabled: true },
      update: { enabled: true },
    });

    if (
      existing?.webhookId &&
      existing.webhookId !== String(webhook.id) &&
      existing.accountId === accountId
    ) {
      try {
        await deleteHostawayWebhook(minted.accessToken, existing.webhookId);
      } catch (err) {
        logServerWarning("hostaway_old_webhook_delete_failed", {
          status: err instanceof HostawayError ? err.status ?? 0 : 0,
        });
      }
    }

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/hostaway`);

    const refreshed = await getHostawaySettings(agentId);
    if (!refreshed.success) return refreshed;
    return { success: true, data: refreshed.data };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        success: false,
        error: "This Hostaway account is already connected to another agent.",
      };
    }
    logServerError("hostaway_connect_failed", {
      status: err instanceof HostawayError ? err.status ?? 0 : 0,
    });
    return { success: false, error: mapHostawayError(err) };
  }
}

export async function updateHostawaySettings(
  agentId: string,
  input: UpdateHostawaySettingsInput,
): Promise<
  { success: true; data: HostawaySettings } | { success: false; error: string }
> {
  const resolved = await requireAgent(agentId);
  if ("error" in resolved) return { success: false, error: resolved.error };

  const parsed = updateHostawaySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid settings",
    };
  }

  const connection = await prisma.hostawayConnection.findUnique({
    where: { agentId },
    select: { id: true },
  });
  if (!connection) return { success: false, error: "Hostaway is not connected" };

  try {
    if (
      parsed.data.autoReplyEnabled !== undefined ||
      parsed.data.escalationEmail !== undefined
    ) {
      await prisma.hostawayConnection.update({
        where: { id: connection.id },
        data: {
          ...(parsed.data.autoReplyEnabled !== undefined
            ? { autoReplyEnabled: parsed.data.autoReplyEnabled }
            : {}),
          ...(parsed.data.escalationEmail !== undefined
            ? { escalationEmail: parsed.data.escalationEmail || null }
            : {}),
        },
      });
    }

    // Channel enablement stays separate from auto-reply so incoming guest
    // messages keep landing in Anselio while replies are paused.

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/hostaway`);

    const refreshed = await getHostawaySettings(agentId);
    if (!refreshed.success) return refreshed;
    return { success: true, data: refreshed.data };
  } catch (err) {
    logServerError("hostaway_settings_update_failed", {
      status: err instanceof HostawayError ? err.status ?? 0 : 0,
    });
    return { success: false, error: "Could not save Hostaway settings" };
  }
}

export async function disconnectHostaway(
  agentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const resolved = await requireAgent(agentId);
  if ("error" in resolved) return { success: false, error: resolved.error };

  const connection = await prisma.hostawayConnection.findUnique({
    where: { agentId },
  });
  if (!connection) return { success: true };

  try {
    const token = await getHostawayAccessToken(connection);

    if (connection.webhookId) {
      try {
        await deleteHostawayWebhook(token, connection.webhookId);
      } catch (err) {
        logServerWarning("hostaway_webhook_delete_failed", {
          status: err instanceof HostawayError ? err.status ?? 0 : 0,
        });
      }
    }

    try {
      await revokeHostawayAccessToken(token);
    } catch (err) {
      logServerWarning("hostaway_token_revoke_failed", {
        status: err instanceof HostawayError ? err.status ?? 0 : 0,
      });
    }

    await prisma.hostawayConnection.delete({ where: { id: connection.id } });
    await prisma.agentChannel.updateMany({
      where: { agentId, channel: "HOSTAWAY" },
      data: { enabled: false },
    });

    revalidatePath(`/dashboard/agents/${agentId}`);
    revalidatePath(`/dashboard/agents/${agentId}/deploy/hostaway`);
    return { success: true };
  } catch (err) {
    logServerError("hostaway_disconnect_failed", {
      status: err instanceof HostawayError ? err.status ?? 0 : 0,
    });
    return { success: false, error: "Could not disconnect Hostaway" };
  }
}
