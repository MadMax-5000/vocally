import { NextResponse } from "next/server";

import { getAssemblyAiWebhookSecret } from "@/lib/assemblyai/env";
import {
  handleAssemblyAiCallConnected,
  handleAssemblyAiCallEnded,
  handleAssemblyAiSessionCompleted,
} from "@/lib/assemblyai/session-handler";
import {
  parseAssemblyAiWebhookEvent,
  verifyAssemblyAiSignature,
} from "@/lib/assemblyai/webhooks";
import { logServerWarning } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const secret = getAssemblyAiWebhookSecret();
    const signature = req.headers.get("x-aai-signature");

    if (secret) {
      if (!verifyAssemblyAiSignature(rawBody, signature, secret)) {
        logServerWarning("[AssemblyAI Webhook] Invalid signature", { source: "webhook-verify" });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 401 });
    }

    const event = parseAssemblyAiWebhookEvent(JSON.parse(rawBody) as unknown);
    if (!event) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    switch (event.event) {
      case "call.connected":
        if (event.call) await handleAssemblyAiCallConnected(event.call);
        break;
      case "session.completed":
        if (event.session) await handleAssemblyAiSessionCompleted(event.session);
        break;
      case "call.ended":
        if (event.call) await handleAssemblyAiCallEnded(event.call);
        break;
      default:
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerWarning("[AssemblyAI Webhook Error]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
