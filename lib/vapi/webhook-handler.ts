import { handleAssistantRequest } from "./language-router";
import { handleToolCalls } from "./tools/bridge";
import { handleEndOfCallReport, logVapiEvent } from "./observability";

export async function handleVapiWebhook(payload: any) {
  const message = payload.message;
  if (!message) {
    return null;
  }

  const type = message.type;

  switch (type) {
    case "assistant-request":
      return await handleAssistantRequest(message);
    
    case "tool-calls":
      return await handleToolCalls(message);

    case "end-of-call-report":
      await handleEndOfCallReport(message);
      break;

    case "status-update":
    case "transcript":
    case "hang":
      await logVapiEvent(message);
      break;

    default:
      console.log(`[Vapi Webhook] Unhandled event type: ${type}`);
  }

  return null;
}
