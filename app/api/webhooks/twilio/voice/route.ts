import { NextRequest } from "next/server";
import { validateTwilioWebhook } from "@/lib/twilio/validate";
import {
  resolveVoiceNumber,
  findOrCreateSession,
  resolveActiveAgent,
} from "@/lib/twilio/voice/handler";
import {
  buildStreamWelcomeTwiML,
  buildNoAgentTwiML,
  buildGoodbyeTwiML,
} from "@/lib/twilio/voice/twiml";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const body = Object.fromEntries(params.entries());

    const url = new URL(req.url);
    const twilioSignature = req.headers.get("x-twilio-signature");
    const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? url.host;
    const fullUrl = `${proto}://${host}${url.pathname}${url.search}`;

    const isValid = validateTwilioWebhook({
      twilioSignature,
      url: fullUrl,
      bodyParams: body as Record<string, string>,
    });

    if (!isValid && process.env.NODE_ENV === "production") {
      return new Response("Invalid signature", { status: 403 });
    }

    const called = body.Called;
    const caller = body.Caller ?? "unknown";
    const callSid = body.CallSid;

    if (!called || !callSid) {
      return buildTwiLResponse(buildGoodbyeTwiML("Missing required call parameters. Goodbye."));
    }

    if (process.env.VOICE_PIPELINE === "vapi") {
      console.warn("[twilio-voice-webhook] Legacy Twilio stream invoked, but VOICE_PIPELINE=vapi. Ensure Twilio phone number is pointed to Vapi serverUrl instead of this webhook.");
      return buildTwiLResponse(buildGoodbyeTwiML("System is configured for Vapi. Please update your Twilio webhook URL. Goodbye."));
    }

    const resolved = await resolveVoiceNumber(called);
    if (!resolved) {
      return buildTwiLResponse(buildNoAgentTwiML());
    }

    let agentId = resolved.agentId;
    if (!agentId) {
      agentId = await resolveActiveAgent(resolved.orgId);
    }

    if (!agentId) {
      return buildTwiLResponse(
        buildGoodbyeTwiML("No voice agent is configured for this number. Goodbye."),
      );
    }

    const { sessionId } = await findOrCreateSession({
      orgId: resolved.orgId,
      agentId,
      callerNumber: caller,
      callSid,
    });

    const wsProto = req.headers.get("x-forwarded-proto") ?? "wss";
    const wsHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const wsUrl = `${wsProto === "https" ? "wss" : "ws"}://${wsHost}/ws/media-streams`;

    return buildTwiLResponse(
      buildStreamWelcomeTwiML("", wsUrl, resolved.orgId, agentId, sessionId),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[twilio-voice-webhook] Error:", message);
    console.error("[twilio-voice-webhook] Path:", req.nextUrl?.pathname ?? req.url);
    return buildTwiLResponse(buildGoodbyeTwiML("An error occurred. Goodbye."));
  }
}

function buildTwiLResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
