import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { MAX_CALL_MINUTES } from "@/lib/billing/plan-features";

export type ResolvedVoiceNumber = {
  orgId: string;
  agentId: string | null;
};

export async function resolveVoiceNumber(
  twilioNumber: string,
): Promise<ResolvedVoiceNumber | null> {
  const mapping = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber },
    include: { org: { select: { id: true } } },
  });

  if (!mapping || !mapping.isActive) return null;
  return { orgId: mapping.org.id, agentId: mapping.agentId };
}

export async function findOrCreateSession(params: {
  orgId: string;
  agentId: string | null;
  callerNumber: string;
  callSid: string;
}): Promise<{ sessionId: string; isNew: boolean }> {
  const { orgId, agentId, callerNumber, callSid } = params;

  const existingCallLog = await prisma.callLog.findFirst({
    where: { twilioCallSid: callSid },
  });

  if (existingCallLog) {
    return { sessionId: existingCallLog.sessionId, isNew: false };
  }

  const session = await prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: "VOICE",
      status: "ACTIVE",
      customerId: callerNumber,
      language: "auto",
    },
  });

  await prisma.callLog.create({
    data: {
      orgId,
      sessionId: session.id,
      twilioCallSid: callSid,
    },
  });

  return { sessionId: session.id, isNew: true };
}

export async function resolveActiveAgent(orgId: string): Promise<string | null> {
  const agent = await prisma.agent.findFirst({
    where: {
      orgId,
      status: "ACTIVE",
      channels: { some: { channel: "VOICE_CALLS", enabled: true } },
    },
    select: { id: true },
  });
  return agent?.id ?? null;
}

export async function resolveWelcomeMessage(agentId: string | null): Promise<string | null> {
  if (!agentId) return null;
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { welcomeMessage: true, name: true },
  });
  return agent?.welcomeMessage ?? null;
}

export async function handleVoiceUtterance(params: {
  orgId: string;
  sessionId: string;
  transcript: string;
}): Promise<{
  botContent: string;
  escalation: boolean;
}> {
  const { orgId, sessionId, transcript } = params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { agentId: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  let agentId = session.agentId;
  if (!agentId) {
    const found = await resolveActiveAgent(orgId);
    if (!found) {
      throw new Error("No active voice agent configured for this organization");
    }
    agentId = found;
    await prisma.session.update({
      where: { id: sessionId },
      data: { agentId },
    });
  }

  await prisma.message.create({
    data: { sessionId, role: "USER", content: transcript },
  });

  const { botContent, escalation } = await processMessage({
    orgId,
    agentId,
    sessionId,
    message: transcript,
    channel: "VOICE",
  });

  await prisma.message.create({
    data: { sessionId, role: "BOT", content: botContent },
  });

  return {
    botContent,
    escalation: !!escalation,
  };
}

export async function getMonthlyCallMinutes(orgId: string): Promise<{ used: number; max: number }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  const plan = org?.plan ?? "FREE";
  const max = MAX_CALL_MINUTES[plan as keyof typeof MAX_CALL_MINUTES] ?? 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.callLog.aggregate({
    where: { orgId, createdAt: { gte: monthStart } },
    _sum: { duration: true },
  });

  const usedSeconds = result._sum.duration ?? 0;
  return { used: Math.ceil(usedSeconds / 60), max };
}
