import { handleAssistantRequest } from "./language-router";
import { handleVapiTranscriptEscalation } from "./escalation-handler";
import { handleToolCalls } from "./tools/bridge";
import { handleEndOfCallReport, logVapiEvent } from "./observability";

export async function handleVapiWebhook(payload: { message?: Record<string, unknown> }) {
  const message = payload.message;
  if (!message) {
    return null;
  }

  const type = message.type;

  switch (type) {
    case "assistant-request":
      return await handleAssistantRequest(
        message as Parameters<typeof handleAssistantRequest>[0],
      );

    case "tool-calls":
      return await handleToolCalls(
        message as Parameters<typeof handleToolCalls>[0],
      );

    case "end-of-call-report":
      await handleEndOfCallReport(message);
      break;

    case "transcript":
      await handleVapiTranscriptEscalation(
        message as Parameters<typeof handleVapiTranscriptEscalation>[0],
      );
      await logVapiEvent(message);
      break;

    case "status-update":
    case "hang":
      await logVapiEvent(message);
      break;

    default:
      if (
        typeof type === "string" &&
        type.startsWith("transcript") &&
        type.includes("final")
      ) {
        await handleVapiTranscriptEscalation(
          message as Parameters<typeof handleVapiTranscriptEscalation>[0],
        );
        await logVapiEvent(message);
      } else {
        console.log(`[Vapi Webhook] Unhandled event type: ${String(type)}`);
      }
  }

  return null;
}
