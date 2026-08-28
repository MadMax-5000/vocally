import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";
import { MAX_CALL_MINUTES } from "@/lib/billing/plan-features";
import { normalizeE164 } from "@/lib/telephony/e164";
import { prependRecordingConsent } from "@/lib/agent-security/consent";

export type ResolvedVoiceNumber = {
  orgId: string;
  agentId: string | null;
};

export async function resolveVoiceNumber(
  twilioNumber: string,
): Promise<ResolvedVoiceNumber | null> {
  const e164 = normalizeE164(twilioNumber);
  const mapping = await prisma.twilioPhoneNumber.findUnique({
    where: { twilioNumber: e164 },
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
  /** When set (Vapi path), stored on CallLog.vapiCallId and used for end-of-call lookup. */
  vapiCallId?: string | null;
}): Promise<{ sessionId: string; isNew: boolean }> {
  const { orgId, agentId, callerNumber, callSid, vapiCallId } = params;

  if (vapiCallId) {
    const byVapi = await prisma.callLog.findUnique({
      where: { vapiCallId },
      select: { sessionId: true },
    });
    if (byVapi) {
      return { sessionId: byVapi.sessionId, isNew: false };
    }
  }

  const existingCallLog = await prisma.callLog.findFirst({
    where: { twilioCallSid: callSid },
  });

  if (existingCallLog) {
    if (vapiCallId && !existingCallLog.vapiCallId) {
      await prisma.callLog.update({
        where: { sessionId: existingCallLog.sessionId },
        data: { vapiCallId },
      });
    }
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
      ...(vapiCallId ? { vapiCallId } : {}),
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
    select: {
      welcomeMessage: true,
      recordingConsentEnabled: true,
      defaultLanguage: true,
    },
  });
  const greeting = agent?.welcomeMessage ?? null;
  const language =
    agent?.defaultLanguage === "ARABIC"
      ? "ar"
      : agent?.defaultLanguage === "DARIJA"
        ? "ary"
        : agent?.defaultLanguage === "FRENCH"
          ? "fr"
          : "en";
  const withConsent = prependRecordingConsent(
    greeting ?? "",
    agent?.recordingConsentEnabled !== false,
    language,
  );
  return withConsent || null;
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
