import {
  evaluateEscalation,
  EscalationTrigger,
  type EscalationDecision,
} from "@/lib/ai/escalation-service";
import {
  resolveEscalationAction,
  resolveEscalationTriggers,
} from "@/lib/deploy/escalation-action";
import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";

import { getVapiControlUrl } from "./transfer-call";
import { performVoiceEscalation } from "./voice-escalation";

type VapiTranscriptMessage = {
  type?: string;
  role?: string;
  transcriptType?: string;
  transcript?: string;
  call?: {
    id?: string;
    monitor?: { controlUrl?: string };
  };
};

const ESCALATABLE_STATUSES = new Set(["ACTIVE", "BOT", "WAITING"]);

export async function handleVapiTranscriptEscalation(
  message: VapiTranscriptMessage,
): Promise<void> {
  if (message.role !== "user") return;
  if (message.transcriptType === "partial") return;

  const transcript = message.transcript?.trim();
  if (!transcript) return;

  const vapiCallId = message.call?.id;
  const controlUrl = getVapiControlUrl(message);
  if (!vapiCallId || !controlUrl) return;

  const callLog = await prisma.callLog.findUnique({
    where: { vapiCallId },
    select: {
      sessionId: true,
      orgId: true,
      session: {
        select: {
          status: true,
          agentId: true,
        },
      },
    },
  });

  if (!callLog?.session.agentId) return;
  if (!ESCALATABLE_STATUSES.has(callLog.session.status)) return;

  await prisma.message.create({
    data: {
      sessionId: callLog.sessionId,
      role: "USER",
      content: transcript,
    },
  });

  const agent = await prisma.agent.findFirst({
    where: { id: callLog.session.agentId, orgId: callLog.orgId },
    select: {
      handoffEnabled: true,
      channels: { select: { channel: true, enabled: true, config: true } },
    },
  });
  if (!agent) return;

  const escalationConfig = resolveEscalationAction(agent.channels);
  if (!agent.handoffEnabled || !escalationConfig.enabled) return;

  const history = await prisma.message.findMany({
    where: { sessionId: callLog.sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });

  const previousBotMessages = history
    .filter((m) => m.role === "BOT")
    .map((m) => ({ content: m.content }));

  const lastBot = [...history].reverse().find((m) => m.role === "BOT");
  const botContent = lastBot?.content ?? "";

  const decision = evaluateEscalation({
    userMessage: transcript,
    botContent,
    llmFailed: false,
    previousBotMessages,
    handoffEnabled: true,
    enabledTriggers: resolveEscalationTriggers(escalationConfig.triggers),
  });

  if (!decision.shouldEscalate) return;

  logServerWarning("vapi.auto_escalation_triggered", {
    sessionId: callLog.sessionId,
    trigger: decision.trigger ?? "unknown",
  });

  await runVoiceEscalation({
    sessionId: callLog.sessionId,
    orgId: callLog.orgId,
    agentId: callLog.session.agentId,
    controlUrl,
    userMessage: transcript,
    decision,
  });
}

export async function runVoiceEscalation(params: {
  sessionId: string;
  orgId: string;
  agentId: string;
  controlUrl: string;
  userMessage: string;
  decision: EscalationDecision;
  defaultTrigger?: EscalationTrigger;
}): Promise<{ success: boolean; error?: string }> {
  const decision: EscalationDecision = params.decision.shouldEscalate
    ? params.decision
    : {
        shouldEscalate: true,
        trigger: params.defaultTrigger ?? EscalationTrigger.USER_REQUESTED,
        reason: "Customer requested transfer to a human agent",
      };

  return performVoiceEscalation({
    sessionId: params.sessionId,
    orgId: params.orgId,
    agentId: params.agentId,
    controlUrl: params.controlUrl,
    userMessage: params.userMessage,
    decision,
  });
}
