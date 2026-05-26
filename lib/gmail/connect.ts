import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { parseLabelIds } from "@/lib/deploy/email-channel-config";

import { google } from "googleapis";

import { createOAuth2Client, encryptRefreshToken, exchangeCodeForTokens } from "./oauth";
import { startGmailWatch } from "./watch";

export async function connectGmailForAgent(params: {
  orgId: string;
  agentId: string;
  code: string;
  labelIds?: string[];
}): Promise<{ googleEmail: string; watchExpiration: Date }> {
  const { orgId, agentId, code, labelIds } = params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) {
    throw new Error("Agent not found");
  }

  const { refreshToken, accessToken } = await exchangeCodeForTokens(code);
  const auth = createOAuth2Client(refreshToken);
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const googleEmail = profile.data.emailAddress?.toLowerCase();
  if (!googleEmail) {
    throw new Error("Could not read Gmail profile email");
  }

  const labels = labelIds ?? ["INBOX"];
  const refreshTokenEnc = encryptRefreshToken(refreshToken);

  await prisma.gmailConnection.upsert({
    where: { agentId },
    create: {
      orgId,
      agentId,
      googleEmail,
      refreshTokenEnc,
      labelIds: labels as Prisma.InputJsonValue,
    },
    update: {
      googleEmail,
      refreshTokenEnc,
      labelIds: labels as Prisma.InputJsonValue,
      historyId: null,
      watchExpiration: null,
    },
  });

  await prisma.agentChannel.upsert({
    where: { agentId_channel: { agentId, channel: "EMAIL" } },
    create: { agentId, channel: "EMAIL", enabled: true },
    update: { enabled: true },
  });

  const watch = await startGmailWatch(agentId, orgId, labels);

  return { googleEmail, watchExpiration: watch.expiration };
}

export async function disconnectGmailForAgent(agentId: string, orgId: string): Promise<void> {
  const connection = await prisma.gmailConnection.findFirst({
    where: { agentId, orgId },
  });
  if (!connection) return;

  const { stopGmailWatch } = await import("./watch");
  const { revokeGoogleToken, decryptRefreshToken } = await import("./oauth");

  try {
    await stopGmailWatch(agentId, orgId);
    const refresh = decryptRefreshToken(connection.refreshTokenEnc);
    await revokeGoogleToken(refresh);
  } catch {
    /* best-effort */
  }

  await prisma.gmailConnection.delete({ where: { id: connection.id } });
}

export function getDefaultLabelIds(): string[] {
  return parseLabelIds(["INBOX"]);
}
