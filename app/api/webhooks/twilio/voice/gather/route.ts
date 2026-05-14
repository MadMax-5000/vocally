import { NextRequest } from "next/server";
import { validateTwilioWebhook } from "@/lib/twilio/validate";
import { prisma } from "@/lib/db/prisma";
import { handleVoiceUtterance } from "@/lib/twilio/voice/handler";
import {
  buildResponseTwiML,
  buildEscalationTwiML,
  buildGoodbyeTwiML,
  buildRepromptTwiML,
} from "@/lib/twilio/voice/twiml";

function buildGatherUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}/api/webhooks/twilio/voice/gather`;
}

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

    const callSid = body.CallSid;
    const speechResult = body.SpeechResult ?? null;
    const digits = body.Digits ?? null;

    if (!callSid) {
      return buildTwiLResponse(buildGoodbyeTwiML("Missing call identifier. Goodbye."));
    }

    const callLog = await prisma.callLog.findFirst({
      where: { twilioCallSid: callSid },
      select: {
        sessionId: true,
        session: { select: { orgId: true, status: true } },
      },
    });

    if (!callLog) {
      return buildTwiLResponse(buildGoodbyeTwiML("Session not found. Goodbye."));
    }

    if (callLog.session.status === "ESCALATED" || callLog.session.status === "RESOLVED" || callLog.session.status === "ABANDONED") {
      return buildTwiLResponse(buildGoodbyeTwiML("This session has ended. Goodbye."));
    }

    if (!speechResult && !digits) {
      return buildTwiLResponse(buildGoodbyeTwiML("We didn&amp;apos;t receive any response. Goodbye."));
    }

    if (digits && !speechResult) {
      const gatherUrl = buildGatherUrl(req);
      return buildTwiLResponse(
        buildRepromptTwiML("Keypad entry is not supported. Please speak your response.", gatherUrl),
      );
    }

    const result = await handleVoiceUtterance({
      orgId: callLog.session.orgId,
      sessionId: callLog.sessionId,
      transcript: speechResult!,
    });

    if (result.escalation) {
      return buildTwiLResponse(
        buildEscalationTwiML("Please hold while we transfer you to a human agent."),
      );
    }

    const gatherUrl = buildGatherUrl(req);
    return buildTwiLResponse(buildResponseTwiML(result.botContent, gatherUrl));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[twilio-voice-gather] Error:", message);
    console.error("[twilio-voice-gather] Path:", req.nextUrl?.pathname ?? req.url);
    return buildTwiLResponse(buildGoodbyeTwiML("An error occurred. Goodbye."));
  }
}

function buildTwiLResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
