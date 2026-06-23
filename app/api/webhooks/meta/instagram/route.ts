import { NextRequest } from "next/server";

import {
  extractInstagramInboundTextMessages,
  verifyMetaWebhookSignature,
  verifyMetaWebhookToken,
} from "@/lib/integrations/instagram/webhook";
import { handleInstagramInboundTextMessage } from "@/lib/integrations/instagram/inbound";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");

  if (mode !== "subscribe" || !challenge) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    if (!verifyMetaWebhookToken(token)) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response(challenge, { status: 200 });
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error ? err.message : "Forbidden";
    return new Response(msg, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  try {
    const ok = verifyMetaWebhookSignature(rawBody, sig);
    if (!ok) {
      return new Response("Invalid signature", { status: 401 });
    }
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error ? err.message : "Unauthorized";
    return new Response(msg, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = extractInstagramInboundTextMessages(parsed);
  for (const m of messages) {
    await handleInstagramInboundTextMessage(m);
  }

  return new Response("OK", { status: 200 });
}

