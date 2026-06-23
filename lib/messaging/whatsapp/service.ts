import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendWhatsAppMessage } from "@/lib/twilio/client";
import type { IncomingWhatsAppPayload, ResolvedSession } from "./whatsapp-types";

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/^whatsapp:/, "");
}

async function resolveOrganization(to: string): Promise<ResolvedSession | null> {
  const mapping = await prisma.whatsappPhoneNumber.findUnique({
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

async function resolveAgentId(
  orgId: string,
  mappedAgentId: string | null,
): Promise<string | null> {
  if (mappedAgentId) {
    const mapped = await prisma.agent.findFirst({
      where: {
        id: mappedAgentId,
        orgId,
        status: "ACTIVE",
        channels: { some: { channel: "WHATSAPP", enabled: true } },
      },
      select: { id: true },
    });
    if (mapped) return mapped.id;
  }

  const fallback = await prisma.agent.findFirst({
    where: {
      orgId,
      status: "ACTIVE",
      channels: { some: { channel: "WHATSAPP", enabled: true } },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id ?? null;
}

async function findActiveSession(orgId: string, customerId: string): Promise<string | null> {
  const session = await prisma.session.findFirst({
    where: {
      orgId,
      customerId,
      channel: "WHATSAPP",
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
      channel: "WHATSAPP",
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

async function handleInboundMessage(payload: IncomingWhatsAppPayload): Promise<void> {
  const { From, To, Body, MessageSid } = payload;

  if (MessageSid) {
    try {
      await prisma.whatsappMessageDedupe.create({ data: { messageId: MessageSid } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return;
      }
      throw e;
    }
  }

  const resolved = await resolveOrganization(To);
  if (!resolved) {
    return;
  }

  const customerPhone = normalizePhoneNumber(From);
  const sessionId =
    (await findActiveSession(resolved.orgId, customerPhone)) ??
    (await createSession(resolved.orgId, resolved.agentId, customerPhone));

  await storeMessage(sessionId, "USER", Body);

  const agentId = await resolveAgentId(resolved.orgId, resolved.agentId);
  if (!agentId) {
    const fallbackBody =
      "No active WhatsApp agent is configured for your organization. Please contact support.";
    await storeMessage(sessionId, "BOT", fallbackBody);
    await sendWhatsAppMessage({ to: From, from: To, body: fallbackBody });
    return;
  }

  const { botContent } = await processMessage({
    orgId: resolved.orgId,
    agentId,
    sessionId,
    message: Body,
  });

  await storeMessage(sessionId, "BOT", botContent);

  await sendWhatsAppMessage({
    to: From,
    from: To,
    body: botContent,
  });
}

export const whatsAppService = {
  handleInboundMessage,
  resolveOrganization,
  findActiveSession,
};
