import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendSmsMessage } from "@/lib/twilio/client";
import type { IncomingSmsPayload, ResolvedSession } from "./sms-types";

async function resolveOrganization(to: string): Promise<ResolvedSession | null> {
  const mapping = await prisma.smsPhoneNumber.findUnique({
    where: { twilioNumber: to },
    include: { org: { select: { id: true } } },
  });

  if (!mapping || !mapping.isActive) return null;
  return {
    sessionId: "",
    orgId: mapping.orgId,
    agentId: mapping.agentId,
    isNew: true,
  };
}

async function findActiveSession(orgId: string, customerId: string): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      orgId,
      customerId,
      channel: "SMS",
      status: { in: ["ACTIVE", "WAITING", "BOT"] },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return session?.id ?? null;
}

async function createSession(orgId: string, agentId: string | null, customerId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: "SMS",
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

async function handleInboundMessage(payload: IncomingSmsPayload): Promise<void> {
  const { From, To, Body, MessageSid } = payload;

  const alreadyProcessed = await prisma.smsMessageDedupe.findUnique({
    where: { messageId: MessageSid },
  });
  if (alreadyProcessed) {
    return;
  }

  await prisma.smsMessageDedupe.create({
    data: { messageId: MessageSid },
  });

  const resolved = await resolveOrganization(To);
  if (!resolved) {
    return;
  }

  const customerPhone = From;
  const sessionId = (await findActiveSession(resolved.orgId, customerPhone))
    ?? await createSession(resolved.orgId, resolved.agentId, customerPhone);

  await storeMessage(sessionId, "USER", Body);

  const agentId = resolved.agentId
    ?? await resolveActiveAgent(resolved.orgId);

  if (!agentId) {
    await storeMessage(sessionId, "BOT", "No active SMS agent is configured for your organization. Please contact support.");
    await sendSmsMessage({ to: From, from: To, body: "No active SMS agent is configured for your organization. Please contact support." });
    return;
  }

  const { botContent } = await processMessage({
    orgId: resolved.orgId,
    agentId,
    sessionId,
    message: Body,
  });

  await storeMessage(sessionId, "BOT", botContent);

  await sendSmsMessage({
    to: From,
    from: To,
    body: botContent,
  });
}

async function resolveActiveAgent(orgId: string): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: {
      orgId,
      status: "ACTIVE",
      channels: { some: { channel: "SMS", enabled: true } },
    },
    select: { id: true },
  });
  return agent?.id ?? null;
}

export const smsService = {
  handleInboundMessage,
  resolveOrganization,
  findActiveSession,
};
