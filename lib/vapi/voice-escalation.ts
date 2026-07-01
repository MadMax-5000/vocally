import {
  applyEscalation,
  createEscalationTicket,
  type EscalationDecision,
} from "@/lib/ai/escalation-service";
import {
  resolveCustomerEscalationMessage,
  resolveEscalationAction,
} from "@/lib/deploy/escalation-action";
import { prisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/logger";
import { getHandoffPhoneNumber } from "@/server/websocket/escalate-call";

import { executeVapiTransfer } from "./transfer-call";

export type VoiceEscalationContext = {
  sessionId: string;
  orgId: string;
  agentId: string;
  controlUrl: string;
  userMessage: string;
  decision: EscalationDecision;
};

export async function performVoiceEscalation(
  ctx: VoiceEscalationContext,
): Promise<{ success: boolean; error?: string }> {
  if (!ctx.decision.shouldEscalate) {
    return { success: false, error: "Escalation not required" };
  }

  const session = await prisma.session.findFirst({
    where: { id: ctx.sessionId, orgId: ctx.orgId },
    select: { status: true },
  });
  if (!session || session.status === "ESCALATED" || session.status === "CLAIMED") {
    return { success: false, error: "Session already escalated or ended" };
  }

  const agent = await prisma.agent.findFirst({
    where: { id: ctx.agentId, orgId: ctx.orgId },
    select: {
      channels: { select: { channel: true, enabled: true, config: true } },
    },
  });
  if (!agent) {
    return { success: false, error: "Agent not found" };
  }

  const escalationConfig = resolveEscalationAction(agent.channels);
  const customerMessage = resolveCustomerEscalationMessage(escalationConfig);

  await applyEscalation({
    sessionId: ctx.sessionId,
    orgId: ctx.orgId,
    decision: ctx.decision,
  });

  if (escalationConfig.createTicketOnEscalate) {
    await createEscalationTicket({
      orgId: ctx.orgId,
      sessionId: ctx.sessionId,
      userMessage: ctx.userMessage,
      decision: ctx.decision,
      config: escalationConfig,
    });
  }

  let handoffPhone: string;
  try {
    handoffPhone = await getHandoffPhoneNumber(ctx.agentId);
  } catch {
    logServerError("vapi.escalation_missing_handoff_phone", {
      agentId: ctx.agentId,
      sessionId: ctx.sessionId,
    });
    return { success: false, error: "No handoff phone configured" };
  }

  const transferred = await executeVapiTransfer({
    controlUrl: ctx.controlUrl,
    handoffPhone,
    message: customerMessage,
  });

  if (!transferred) {
    return { success: false, error: "Vapi transfer failed" };
  }

  return { success: true };
}
