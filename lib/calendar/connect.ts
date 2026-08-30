import { prisma } from "@/lib/db/prisma";
import type { BookAppointmentActionConfig } from "@/lib/deploy/book-appointment-action";
import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";
import { Prisma } from "@prisma/client";

import { listGoogleCalendarsForConnection } from "./google/client";
import {
  decryptCalendarToken,
  encryptCalendarToken,
  exchangeGoogleCalendarCode,
  revokeGoogleCalendarToken,
} from "./google/oauth";
import { getCalendlyUserMe } from "./calendly/client";
import { encryptCalendlyToken, exchangeCalendlyCode } from "./calendly/oauth";

async function requireAgent(agentId: string, orgId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) throw new Error("Agent not found");
  return agent;
}

async function setCalendarProviderOnAction(
  agentId: string,
  calendarProvider: BookAppointmentActionConfig["calendarProvider"],
) {
  const existing = await prisma.agentChannel.findUnique({
    where: { agentId_channel: { agentId, channel: "WEB_CHAT" } },
  });
  const existingConfig =
    existing?.config && typeof existing.config === "object" && !Array.isArray(existing.config)
      ? (existing.config as Record<string, unknown>)
      : {};
  const parsed = parseWebChatConfig(existingConfig);
  const current = parsed.actions?.bookAppointment ?? {};
  const nextAction: BookAppointmentActionConfig = {
    ...current,
    calendarProvider,
  };
  if (calendarProvider !== "calendly") {
    delete nextAction.eventTypeUri;
  }
  const nextConfig = {
    ...existingConfig,
    actions: {
      ...(parsed.actions ?? {}),
      bookAppointment: nextAction,
    },
  } as Prisma.InputJsonValue;

  await prisma.agentChannel.upsert({
    where: { agentId_channel: { agentId, channel: "WEB_CHAT" } },
    create: {
      agentId,
      channel: "WEB_CHAT",
      enabled: true,
      config: nextConfig,
    },
    update: { config: nextConfig },
  });
}

export async function connectGoogleCalendarForAgent(params: {
  orgId: string;
  agentId: string;
  code: string;
}): Promise<{ accountEmail: string; calendarId: string }> {
  const { orgId, agentId, code } = params;
  await requireAgent(agentId, orgId);

  const { refreshToken, accessToken } = await exchangeGoogleCalendarCode(code);

  const { google } = await import("googleapis");
  const { createGoogleCalendarOAuthClient } = await import("./google/oauth");
  const auth = createGoogleCalendarOAuthClient(refreshToken);
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const calendar = google.calendar({ version: "v3", auth });
  const list = await calendar.calendarList.list({ minAccessRole: "writer" });
  const primary =
    list.data.items?.find((item) => item.primary) ?? list.data.items?.[0];
  const calendarId = primary?.id ?? "primary";
  const accountEmail = (primary?.id?.includes("@") ? primary.id : primary?.summary) ?? null;

  await prisma.calendarConnection.upsert({
    where: { agentId },
    create: {
      orgId,
      agentId,
      provider: "GOOGLE",
      refreshTokenEnc: encryptCalendarToken(refreshToken),
      accountEmail,
      calendarId,
      accessTokenEnc: null,
      tokenExpiresAt: null,
      externalUserUri: null,
      externalOrgUri: null,
    },
    update: {
      provider: "GOOGLE",
      refreshTokenEnc: encryptCalendarToken(refreshToken),
      accountEmail,
      calendarId,
      accessTokenEnc: null,
      tokenExpiresAt: null,
      externalUserUri: null,
      externalOrgUri: null,
    },
  });

  await setCalendarProviderOnAction(agentId, "google");
  return { accountEmail: accountEmail ?? calendarId, calendarId };
}

export async function connectCalendlyForAgent(params: {
  orgId: string;
  agentId: string;
  code: string;
}): Promise<{ accountEmail: string | null }> {
  const { orgId, agentId, code } = params;
  await requireAgent(agentId, orgId);

  const tokens = await exchangeCalendlyCode(code);
  const me = await getCalendlyUserMe(tokens.accessToken);

  await prisma.calendarConnection.upsert({
    where: { agentId },
    create: {
      orgId,
      agentId,
      provider: "CALENDLY",
      refreshTokenEnc: encryptCalendlyToken(tokens.refreshToken),
      accessTokenEnc: encryptCalendlyToken(tokens.accessToken),
      tokenExpiresAt: tokens.expiresAt,
      accountEmail: me.email,
      calendarId: null,
      externalUserUri: me.uri,
      externalOrgUri: me.organizationUri,
    },
    update: {
      provider: "CALENDLY",
      refreshTokenEnc: encryptCalendlyToken(tokens.refreshToken),
      accessTokenEnc: encryptCalendlyToken(tokens.accessToken),
      tokenExpiresAt: tokens.expiresAt,
      accountEmail: me.email,
      calendarId: null,
      externalUserUri: me.uri,
      externalOrgUri: me.organizationUri,
    },
  });

  await setCalendarProviderOnAction(agentId, "calendly");
  return { accountEmail: me.email };
}

export async function disconnectCalendarForAgent(
  agentId: string,
  orgId: string,
): Promise<void> {
  const connection = await prisma.calendarConnection.findFirst({
    where: { agentId, orgId },
  });
  if (!connection) {
    await setCalendarProviderOnAction(agentId, "none");
    return;
  }

  if (connection.provider === "GOOGLE") {
    try {
      const refresh = decryptCalendarToken(connection.refreshTokenEnc);
      await revokeGoogleCalendarToken(refresh);
    } catch {
      /* best-effort */
    }
  }

  await prisma.calendarConnection.delete({ where: { id: connection.id } });
  await setCalendarProviderOnAction(agentId, "none");
}

export async function updateGoogleCalendarIdForAgent(params: {
  agentId: string;
  orgId: string;
  calendarId: string;
}): Promise<void> {
  const connection = await prisma.calendarConnection.findFirst({
    where: { agentId: params.agentId, orgId: params.orgId, provider: "GOOGLE" },
  });
  if (!connection) throw new Error("Google Calendar is not connected");
  const calendars = await listGoogleCalendarsForConnection(connection);
  const allowed = calendars.some((item) => item.id === params.calendarId);
  if (!allowed) throw new Error("Calendar not found");
  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: { calendarId: params.calendarId },
  });
}
