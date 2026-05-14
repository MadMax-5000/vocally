import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { sendEmail } from "@/lib/email/send";
import type { InboundEmailPayload, ResolvedEmailSession } from "./email-types";

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
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
  return payload.text ?? (payload.html ? stripHtml(payload.html) : "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function handleInboundEmail(payload: InboundEmailPayload): Promise<void> {
  if (!payload.to || payload.to.length === 0) return;

  const resolved = await resolveOrganization(payload.to[0]);
  if (!resolved) {
    return;
  }

  const customerEmail = extractEmailAddress(payload.from);
  const body = extractTextBody(payload);

  if (!body) return;

  const sessionId = (await findActiveSession(resolved.orgId, customerEmail))
    ?? await createSession(resolved.orgId, resolved.agentId, customerEmail);

  await storeMessage(sessionId, "USER", body);

  const agentId = resolved.agentId
    ?? await resolveActiveAgent(resolved.orgId);

  if (!agentId) {
    const fallback = "No active email agent is configured for your organization. Please contact support.";
    await storeMessage(sessionId, "BOT", fallback);
    await sendEmail({
      to: customerEmail,
      subject: `Re: ${payload.subject}`,
      body: fallback,
    });
    return;
  }

  const { botContent } = await processMessage({
    orgId: resolved.orgId,
    agentId,
    sessionId,
    message: body,
  });

  await storeMessage(sessionId, "BOT", botContent);

  await sendEmail({
    to: customerEmail,
    subject: `Re: ${payload.subject}`,
    body: botContent,
  });
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
