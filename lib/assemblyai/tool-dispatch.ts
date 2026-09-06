import { EscalationTrigger } from "@/lib/ai/escalation-service";
import { getToolHandler } from "@/lib/ai/tools/registry";
import { isExternalCalendarActive, loadCalendarConnection } from "@/lib/calendar/service";
import { resolveBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { prisma } from "@/lib/db/prisma";
import { normalizeE164 } from "@/lib/telephony/e164";
import { logServerWarning } from "@/lib/logger";

import { searchVoiceKnowledge } from "./knowledge";
import { SEARCH_KNOWLEDGE_TOOL_NAME, TRANSFER_TO_HUMAN_TOOL_NAME } from "./tools";

export async function resolveLiveCallContext(params: {
  agentId: string;
  orgId: string;
  fromNumber?: string;
}): Promise<{ sessionId: string } | null> {
  const fromE164 = params.fromNumber ? normalizeE164(params.fromNumber) : null;

  const callLog = await prisma.callLog.findFirst({
    where: {
      orgId: params.orgId,
      session: {
        agentId: params.agentId,
        status: { in: ["ACTIVE", "BOT", "WAITING"] },
        ...(fromE164 ? { customerId: fromE164 } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    select: { sessionId: true },
  });

  return callLog ? { sessionId: callLog.sessionId } : null;
}

export async function dispatchAssemblyAiTool(params: {
  agentId: string;
  toolName: string;
  args: Record<string, unknown>;
}): Promise<string> {
  const agent = await prisma.agent.findUnique({
    where: { id: params.agentId },
    select: {
      id: true,
      orgId: true,
      channels: { select: { channel: true, enabled: true, config: true } },
    },
  });
  if (!agent) {
    return JSON.stringify({ error: "Agent not found." });
  }

  const fromNumber =
    typeof params.args.from_number === "string"
      ? params.args.from_number
      : typeof params.args.fromNumber === "string"
        ? params.args.fromNumber
        : undefined;

  const live = await resolveLiveCallContext({
    agentId: agent.id,
    orgId: agent.orgId,
    fromNumber,
  });

  if (params.toolName === SEARCH_KNOWLEDGE_TOOL_NAME) {
    const query = typeof params.args.query === "string" ? params.args.query : "";
    if (!query.trim()) {
      return JSON.stringify({ error: "Missing query." });
    }
    const context = await searchVoiceKnowledge({
      orgId: agent.orgId,
      agentId: agent.id,
      query,
    });
    return context
      ? JSON.stringify({ snippets: context })
      : JSON.stringify({ snippets: "", message: "No matching knowledge found." });
  }

  if (!live) {
    return JSON.stringify({
      error: "No active call found for this agent. Ask the caller to repeat after a moment.",
    });
  }

  if (params.toolName === TRANSFER_TO_HUMAN_TOOL_NAME) {
    const reason =
      typeof params.args.reason === "string"
        ? params.args.reason
        : "Customer requested a human agent";
    const summary = typeof params.args.summary === "string" ? params.args.summary : reason;

    await prisma.session.update({
      where: { id: live.sessionId },
      data: {
        status: "ESCALATED",
        escalatedAt: new Date(),
        escalatedReason: reason,
      },
    });

    try {
      await prisma.ticket.create({
        data: {
          orgId: agent.orgId,
          sessionId: live.sessionId,
          subject: "Voice escalation",
          description: summary,
          priority: "HIGH",
        },
      });
    } catch (err) {
      logServerWarning("[AssemblyAI] Escalation ticket failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return JSON.stringify({
      status: "escalated",
      trigger: EscalationTrigger.USER_REQUESTED,
      message:
        "A teammate has been notified. Live SIP transfer is not available on this trunk; offer a callback if needed.",
    });
  }

  const handler = getToolHandler(params.toolName);
  if (!handler) {
    return JSON.stringify({ error: `Unknown tool ${params.toolName}.` });
  }

  const bookAppointment = resolveBookAppointmentAction(agent.channels);
  const calendarConnection = await loadCalendarConnection(agent.id, agent.orgId);

  return handler(params.args, {
    orgId: agent.orgId,
    sessionId: live.sessionId,
    agentId: agent.id,
    channel: "VOICE",
    bookAppointment: bookAppointment.enabled ? bookAppointment : undefined,
    calendarConnection: isExternalCalendarActive(bookAppointment, calendarConnection)
      ? calendarConnection
      : null,
  });
}
