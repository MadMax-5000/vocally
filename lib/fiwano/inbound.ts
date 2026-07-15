import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendFiwanoText } from "@/lib/fiwano/client";
import type { FiwanoWebhookPayload } from "@/lib/fiwano/types";

const CHANNEL_TYPE_MAP: Record<string, string> = {
  instagram: "INSTAGRAM",
  facebook: "MESSENGER",
  whatsapp: "WHATSAPP",
};

export async function handleFiwanoInbound(payload: FiwanoWebhookPayload) {
  if (payload.event !== "message.received") return;
  const text = payload.data.text;
  if (!text) return;

  const channel = await prisma.fiwanoChannel.findUnique({
    where: { channelId: payload.channel_id },
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
  const channelType = CHANNEL_TYPE_MAP[payload.data.channel_type];
  if (!channelType) return;

  const agentChannel = agent.channels.find(
    (c: { channel: string; enabled: boolean }) => c.channel === channelType,
  );
  if (!agentChannel?.enabled) return;

  const session = await findOrCreateSession({
    orgId: agent.orgId,
    agentId: agent.id,
    channelType: channelType as any,
    senderId: payload.data.from,
  });

  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: text,
    },
  });

  const result = await processMessage({
    orgId: agent.orgId,
    agentId: agent.id,
    sessionId: session.id,
    message: text,
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
    await sendFiwanoText(payload.channel_id, payload.data.from, result.botContent);
  } catch (err) {
    console.error("Fiwano send failed:", err);
  }
}

async function findOrCreateSession({
  orgId,
  agentId,
  channelType,
  senderId,
}: {
  orgId: string;
  agentId: string;
  channelType: string;
  senderId: string;
}) {
  const existing = await prisma.session.findFirst({
    where: {
      orgId,
      agentId,
      channel: channelType as any,
      customerId: senderId,
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
      customerId: senderId,
      status: "ACTIVE",
    },
  });
}
