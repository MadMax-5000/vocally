import { google } from "googleapis";

import { prisma } from "@/lib/db/prisma";
import { parseLabelIds } from "@/lib/deploy/email-channel-config";

import { createOAuth2Client, decryptRefreshToken } from "./oauth";

export async function getGmailConnectionForAgent(agentId: string, orgId: string) {
  return prisma.gmailConnection.findFirst({
    where: { agentId, orgId },
  });
}

export async function getGmailClientForAgent(agentId: string, orgId: string) {
  const connection = await getGmailConnectionForAgent(agentId, orgId);
  if (!connection) {
    throw new Error("Gmail not connected for this agent");
  }
  const refreshToken = decryptRefreshToken(connection.refreshTokenEnc);
  const auth = createOAuth2Client(refreshToken);
  const gmail = google.gmail({ version: "v1", auth });
  return { gmail, connection, auth };
}

export async function getGmailClientByEmail(googleEmail: string) {
  const connection = await prisma.gmailConnection.findFirst({
    where: { googleEmail: googleEmail.toLowerCase() },
    include: {
      agent: {
        select: {
          id: true,
          orgId: true,
          status: true,
          channels: { where: { channel: "EMAIL" } },
        },
      },
    },
  });
  if (!connection) return null;

  const refreshToken = decryptRefreshToken(connection.refreshTokenEnc);
  const auth = createOAuth2Client(refreshToken);
  const gmail = google.gmail({ version: "v1", auth });
  const labelIds = parseLabelIds(connection.labelIds);
  return { gmail, connection, auth, labelIds, agent: connection.agent };
}
