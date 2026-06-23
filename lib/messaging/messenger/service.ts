import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendMessengerText } from "@/lib/meta/send";

import type { MetaMessengerWebhookPayload } from "./messenger-types";

async function findActiveSession(orgId: string, customerId: string): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      orgId,
      customerId,
      channel: "MESSENGER",
      status: { in: ["ACTIVE", "WAITING", "BOT"] },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return session?.id ?? null;
}

async function createSession(orgId: string, agentId: string, customerId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: "MESSENGER",
      status: "ACTIVE",
      customerId,
      language: "auto",
    },
  });
  return session.id;
}

async function storeMessage(sessionId: string, role: "USER" | "BOT", content: string): Promise<void> {
  await prisma.message.create({
    data: { sessionId, role, content },
  });
}

async function resolveConnectionByPageId(pageId: string) {
  return prisma.messengerConnection.findUnique({
    where: { pageId },
    include: {
      org: { select: { id: true } },
      agent: { select: { id: true, status: true, channels: { where: { channel: "MESSENGER" } } } },
    },
  });
}

async function handleInboundTextMessage(params: {
  pageId: string;
  senderPsid: string;
  text: string;
}): Promise<void> {
  const { pageId, senderPsid, text } = params;

  const connection = await resolveConnectionByPageId(pageId);
  if (!connection) return;

  if (connection.agent.status !== "ACTIVE") return;
  if (!connection.agent.channels[0]?.enabled) return;

  const orgId = connection.org.id;
  const agentId = connection.agent.id;

  const sessionId =
    (await findActiveSession(orgId, senderPsid)) ?? (await createSession(orgId, agentId, senderPsid));

  await storeMessage(sessionId, "USER", text);

  const { botContent } = await processMessage({
    orgId,
    agentId,
    sessionId,
    message: text,
  });

  await storeMessage(sessionId, "BOT", botContent);

  await sendMessengerText({
    pageId: connection.pageId,
    pageAccessTokenEnc: connection.pageAccessTokenEnc,
    recipientPsid: senderPsid,
    text: botContent,
  });
}

export async function handleMessengerWebhookEvent(payload: MetaMessengerWebhookPayload): Promise<void> {
  if (!payload.entry || !Array.isArray(payload.entry)) return;

  for (const entry of payload.entry) {
    const pageId = entry?.id;
    if (!pageId) continue;
    const messaging = entry.messaging;
    if (!messaging || !Array.isArray(messaging)) continue;

    for (const event of messaging) {
      const senderPsid = event.sender?.id;
      const message = event.message;
      if (!senderPsid || !message) continue;
      if (message.is_echo) continue;

      const text = typeof message.text === "string" ? message.text.trim() : "";
      if (!text) continue;

      await handleInboundTextMessage({ pageId, senderPsid, text });
    }
  }
}

export const messengerService = {
  handleMessengerWebhookEvent,
};

