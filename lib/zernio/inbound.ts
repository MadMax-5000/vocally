import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendZernioMessage } from "@/lib/zernio/client";
import type { ZernioWebhookPayload } from "@/lib/zernio/types";

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  instagram: "INSTAGRAM",
  facebook: "MESSENGER",
  whatsapp: "WHATSAPP",
};

export async function handleZernioInbound(payload: ZernioWebhookPayload) {
  if (payload.event !== "message.received") return;
  if (!payload.message.text) return;
  if (payload.message.direction !== "incoming") return;

  const accountId = payload.account.id;
  const conversationId = payload.conversation.id;
  const platform = payload.message.platform;
  const channelType = PLATFORM_TO_CHANNEL[platform];
  if (!channelType) return;

  const channel = await prisma.zernioChannel.findUnique({
    where: { accountId },
    include: {
      agent: {
        select: {
          id: true,
          orgId: true,
          channels: { select: { channel: true, enabled: true } },
        },
      },
    },
  });
  if (!channel) return;

  const { agent } = channel;
  const agentChannel = agent.channels.find(
    (c: { channel: string; enabled: boolean }) => c.channel === channelType,
  );
  if (!agentChannel?.enabled) return;

  const session = await findOrCreateSession({
    orgId: agent.orgId,
    agentId: agent.id,
    channelType,
    customerId: conversationId,
    customerName: payload.conversation.participantName ?? undefined,
  });

  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: payload.message.text,
    },
  });

  const result = await processMessage({
    orgId: agent.orgId,
    agentId: agent.id,
    sessionId: session.id,
    message: payload.message.text,
    channel: channelType as any,
  });

  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: "BOT",
      content: result.botContent,
    },
  });

  try {
    await sendZernioMessage(conversationId, accountId, result.botContent);
  } catch (err) {
    console.error("Zernio send failed:", err);
  }
}

async function findOrCreateSession({
  orgId,
  agentId,
  channelType,
  customerId,
  customerName,
}: {
  orgId: string;
  agentId: string;
  channelType: string;
  customerId: string;
  customerName?: string;
}) {
  const existing = await prisma.session.findFirst({
    where: {
      orgId,
      agentId,
      channel: channelType as any,
      customerId,
      status: { in: ["ACTIVE", "WAITING", "BOT"] },
    },
    orderBy: { startedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: channelType as any,
      customerId,
      status: "ACTIVE",
    },
  });
}
