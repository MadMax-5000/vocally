import { getToolHandler } from "@/lib/ai/tools/registry";
import { applyEscalation, EscalationTrigger } from "@/lib/ai/escalation-service";
import { getHandoffPhoneNumber } from "@/server/websocket/escalate-call";
import { prisma } from "@/lib/db/prisma";

export async function handleToolCalls(message: any) {
  const toolCallList = message.toolCallList;
  if (!toolCallList || toolCallList.length === 0) {
    return { results: [] };
  }

  const sessionId = message.call?.id; // Assuming we use vapiCallId or we pass sessionId in metadata
  // Wait, in assistant-request we added metadata.sessionId to the assistant
  // No, assistant metadata might not be directly in message, but we can look it up by vapiCallId
  
  const callId = message.call?.id;
  let internalSessionId: string | null = null;
  let orgId: string | null = null;
  let agentId: string | undefined = undefined;

  if (callId) {
    const callLog = await prisma.callLog.findUnique({
      where: { vapiCallId: callId },
      select: { sessionId: true, orgId: true, session: { select: { agentId: true } } }
    });
    if (callLog) {
      internalSessionId = callLog.sessionId;
      orgId = callLog.orgId;
      agentId = callLog.session.agentId ?? void 0;
    }
  }

  const results = [];

  for (const toolCall of toolCallList) {
    const name = toolCall.name;
    const parameters = toolCall.parameters || {};
    const startTime = Date.now();
    let success = false;
    let toolResult: any = null;

    try {
      if (name === "transfer_to_human") {
        if (internalSessionId && orgId && agentId) {
          await applyEscalation({
            sessionId: internalSessionId,
            orgId: orgId,
            decision: {
              shouldEscalate: true,
              trigger: EscalationTrigger.USER_REQUESTED,
              reason: parameters.reason
            }
          });
          
          let handoffPhone = null;
          try {
            handoffPhone = await getHandoffPhoneNumber(agentId);
          } catch (e) {
            console.error("[Vapi Tools] Error resolving handoff phone:", e);
          }

          if (handoffPhone) {
            toolResult = {
              destination: {
                type: "number",
                number: handoffPhone
              }
            };
            success = true;
          } else {
            toolResult = "Failed to transfer: No handoff number configured.";
          }
        } else {
          toolResult = "Session details not found.";
        }
      } else {
        const handler = getToolHandler(name);
        if (handler && internalSessionId && orgId) {
          toolResult = await handler(parameters, {
            orgId: orgId!,
            sessionId: internalSessionId!,
            agentId: agentId ?? undefined,
            channel: "VOICE",
          });
          success = true;
        } else {
          toolResult = `Tool ${name} not found or missing session details.`;
        }
      }
    } catch (err: any) {
      console.error(`[Vapi Tools] Error executing ${name}:`, err);
      toolResult = `Error executing tool: ${err.message}`;
    }

    const latencyMs = Date.now() - startTime;

    if (internalSessionId) {
      await prisma.toolExecutionLog.create({
        data: {
          sessionId: internalSessionId,
          toolName: name,
          parameters: parameters,
          result: typeof toolResult === 'string' ? { message: toolResult } : toolResult,
          success,
          latencyMs
        }
      });
    }

    if (name === "transfer_to_human" && success && toolResult?.destination) {
      results.push({
        toolCallId: toolCall.id,
        result: toolResult // Vapi understands this special transfer shape
      });
    } else {
      results.push({
        toolCallId: toolCall.id,
        result: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
      });
    }
  }

  return { results };
}
