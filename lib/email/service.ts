import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendEmail } from "@/lib/email/send";
import type { InboundEmailPayload, ResolvedEmailSession } from "./email-types";
import { plainTextFromInboundParts } from "./email-body";

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

async function resolveFirstMatchingAddress(
  toList: string[],
): Promise<{ resolved: ResolvedEmailSession; matchedMailbox: string } | null> {
  for (const raw of toList) {
    const mailbox = extractEmailAddress(raw);
    const resolved = await resolveOrganization(raw);
    if (resolved) {
      return { resolved, matchedMailbox: mailbox };
    }
  }
  return null;
}

async function resolveOrganization(to: string): Promise<ResolvedEmailSession | null> {
  const address = extractEmailAddress(to);
  const mapping = await prisma.emailAddress.findUnique({
    where: { email: address },
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
      channel: "EMAIL",
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
      channel: "EMAIL",
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

function extractTextBody(payload: InboundEmailPayload): string {
  return plainTextFromInboundParts(payload.text, payload.html);
}

async function handleInboundEmail(payload: InboundEmailPayload): Promise<void> {
  if (!payload.to || payload.to.length === 0) return;

  const match = await resolveFirstMatchingAddress(payload.to);
  if (!match) {
    return;
  }

  const { resolved, matchedMailbox } = match;

  const customerEmail = extractEmailAddress(payload.from);
  const body = extractTextBody(payload);

  if (!body) return;

  const sessionId = (await findActiveSession(resolved.orgId, customerEmail))
    ?? await createSession(resolved.orgId, resolved.agentId, customerEmail);

  await storeMessage(sessionId, "USER", body);

  const agentId = resolved.agentId
    ?? await resolveActiveAgent(resolved.orgId);

  const replyFrom = payload.replyFromEmail ?? matchedMailbox;

  if (!agentId) {
    const fallback = "No active email agent is configured for your organization. Please contact support.";
    await storeMessage(sessionId, "BOT", fallback);
    await sendEmail({
      from: replyFrom,
      to: customerEmail,
      subject: replySubject(payload.subject),
      body: fallback,
    });
    return;
  }

  const { botContent } = await processMessage({
    orgId: resolved.orgId,
    agentId,
    sessionId,
    message: body,
    channel: "EMAIL",
  });

  await storeMessage(sessionId, "BOT", botContent);

  await sendEmail({
    from: replyFrom,
    to: customerEmail,
    subject: replySubject(payload.subject),
    body: botContent,
  });
}

function replySubject(original: string): string {
  const trimmed = original.trim();
  if (/^re:\s/i.test(trimmed)) {
    return trimmed;
  }
  return `Re: ${trimmed}`;
}

async function resolveActiveAgent(orgId: string): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: {
      orgId,
      status: "ACTIVE",
      channels: { some: { channel: "EMAIL", enabled: true } },
    },
    select: { id: true },
  });
  return agent?.id ?? null;
}

export const emailService = {
  handleInboundEmail,
  resolveOrganization,
  findActiveSession,
};
