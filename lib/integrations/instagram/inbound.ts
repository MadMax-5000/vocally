import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { decryptPageAccessToken } from "@/lib/integrations/instagram/oauth";
import { sendInstagramTextMessage } from "@/lib/integrations/instagram/send-message";

export async function handleInstagramInboundTextMessage(args: {
  pageId: string;
  senderId: string;
  recipientId: string;
  messageId: string;
  text: string;
}): Promise<void> {
  const connection = await prisma.instagramConnection.findFirst({
    where: { pageId: args.pageId },
    select: { orgId: true, agentId: true, pageAccessTokenEnc: true },
  });
  if (!connection) {
    // Not connected in our DB; acknowledge silently.
    return;
  }

  // Dedupe against webhook retries.
  try {
    await prisma.instagramMessageDedupe.create({ data: { messageId: args.messageId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return;
    }
    throw e;
  }

  // Session routing: one active session per (agent, sender) for Instagram.
  const existing = await prisma.session.findFirst({
    where: {
      orgId: connection.orgId,
      agentId: connection.agentId,
      channel: "INSTAGRAM",
      customerId: args.senderId,
      status: { in: ["ACTIVE", "WAITING", "BOT", "HUMAN", "ESCALATED", "CLAIMED"] },
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  const sessionId =
    existing?.id ??
    (
      await prisma.session.create({
        data: {
          orgId: connection.orgId,
          agentId: connection.agentId,
          channel: "INSTAGRAM",
          status: "ACTIVE",
          language: "auto",
          customerId: args.senderId,
        },
        select: { id: true },
      })
    ).id;

  await prisma.message.create({
    data: {
      sessionId,
      role: "USER",
      content: args.text,
    },
  });

  const { botContent } = await processMessage({
    orgId: connection.orgId,
    agentId: connection.agentId,
    sessionId,
    message: args.text,
    channel: "CHAT",
  });

  await prisma.message.create({
    data: {
      sessionId,
      role: "BOT",
      content: botContent,
    },
  });

  const pageAccessToken = decryptPageAccessToken(connection.pageAccessTokenEnc);
  await sendInstagramTextMessage({
    pageAccessToken,
    recipientIgScopedId: args.senderId,
    text: botContent,
    replyToMessageId: args.messageId,
  });
}

