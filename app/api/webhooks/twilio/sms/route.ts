import { NextRequest } from "next/server";
import { validateTwilioWebhook } from "@/lib/twilio/validate";
import { smsService } from "@/lib/messaging/sms/service";

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

    if (!isValid) {
      return new Response("Invalid signature", { status: 403 });
    }

    if (!body.MessageSid || !body.From || !body.To) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (body.NumMedia && parseInt(body.NumMedia, 10) > 0) {
      await smsService.handleInboundMessage(body as any);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Media messages are not supported yet. Please send text only.</Message></Response>`, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    await smsService.handleInboundMessage(body as any);

    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[twilio-sms-webhook] Error:", message);
    console.error("[twilio-sms-webhook] Path:", req.nextUrl?.pathname ?? req.url);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>An error occurred processing your message.</Message></Response>`, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
