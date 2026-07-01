import { getToolHandler } from "@/lib/ai/tools/registry";
import { EscalationTrigger } from "@/lib/ai/escalation-service";
import { prisma } from "@/lib/db/prisma";

import { runVoiceEscalation } from "../escalation-handler";
import { getVapiControlUrl } from "../transfer-call";

type VapiToolCall = {
  id: string;
  name: string;
  parameters?: Record<string, unknown>;
};

type VapiToolCallsMessage = {
  toolCallList?: VapiToolCall[];
  call?: {
    id?: string;
    monitor?: { controlUrl?: string };
  };
};

export async function handleToolCalls(message: VapiToolCallsMessage) {
  const toolCallList = message.toolCallList;
  if (!toolCallList || toolCallList.length === 0) {
    return { results: [] };
  }

  const callId = message.call?.id;
  const controlUrl = getVapiControlUrl(message);
  let internalSessionId: string | null = null;
  let orgId: string | null = null;
  let agentId: string | undefined;

  if (callId) {
    const callLog = await prisma.callLog.findUnique({
      where: { vapiCallId: callId },
      select: {
        sessionId: true,
        orgId: true,
        session: { select: { agentId: true } },
      },
    });
    if (callLog) {
      internalSessionId = callLog.sessionId;
      orgId = callLog.orgId;
      agentId = callLog.session.agentId ?? undefined;
    }
  }

  const results = [];

  for (const toolCall of toolCallList) {
    const name = toolCall.name;
    const parameters = toolCall.parameters ?? {};
    const startTime = Date.now();
    let success = false;
    let toolResult: string | Record<string, unknown> = "";

    try {
      if (name === "transfer_to_human") {
        const reason =
          typeof parameters.reason === "string"
            ? parameters.reason
            : "Customer requested transfer to a human agent";

        if (!internalSessionId || !orgId || !agentId) {
          toolResult = "Session details not found.";
        } else if (!controlUrl) {
          toolResult = "Transfer control URL not available for this call.";
        } else {
          const escalationResult = await runVoiceEscalation({
            sessionId: internalSessionId,
            orgId,
            agentId,
            controlUrl,
            userMessage: reason,
            decision: {
              shouldEscalate: true,
              trigger: EscalationTrigger.USER_REQUESTED,
              reason,
            },
          });

          if (escalationResult.success) {
            success = true;
            toolResult = "Transfer initiated.";
          } else {
            toolResult =
              escalationResult.error ?? "Failed to transfer to a human agent.";
          }
        }
      } else {
        const handler = getToolHandler(name);
        if (handler && internalSessionId && orgId) {
          toolResult = await handler(parameters, {
            orgId,
            sessionId: internalSessionId,
            agentId,
            channel: "VOICE",
          });
          success = true;
        } else {
          toolResult = `Tool ${name} not found or missing session details.`;
        }
      }
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      toolResult = `Error executing tool: ${messageText}`;
    }

    const latencyMs = Date.now() - startTime;

    if (internalSessionId) {
      await prisma.toolExecutionLog.create({
        data: {
          sessionId: internalSessionId,
          toolName: name,
          parameters: parameters as object,
          result:
            typeof toolResult === "string"
              ? { message: toolResult }
              : (toolResult as object),
          success,
          latencyMs,
        },
      });
    }

    results.push({
      toolCallId: toolCall.id,
      result: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
    });
  }

  return { results };
}
