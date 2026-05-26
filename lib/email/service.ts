import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendEmail } from "@/lib/email/send";
import {
  createEmailSession,
  findActiveEmailSession,
  resolveActiveEmailAgent,
  storeEmailMessage,
} from "@/lib/email/session-helpers";
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

  const sessionId = (await findActiveEmailSession(resolved.orgId, customerEmail))
    ?? (await createEmailSession(resolved.orgId, resolved.agentId, customerEmail));

  await storeEmailMessage(sessionId, "USER", body);

  const agentId = resolved.agentId ?? (await resolveActiveEmailAgent(resolved.orgId));

  const replyFrom = payload.replyFromEmail ?? matchedMailbox;

  if (!agentId) {
    const fallback = "No active email agent is configured for your organization. Please contact support.";
    await storeEmailMessage(sessionId, "BOT", fallback);
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

  await storeEmailMessage(sessionId, "BOT", botContent);

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

export const emailService = {
  handleInboundEmail,
  resolveOrganization,
  findActiveSession: findActiveEmailSession,
};
