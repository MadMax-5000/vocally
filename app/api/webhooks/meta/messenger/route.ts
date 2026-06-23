import { NextRequest } from "next/server";

import { decryptToken } from "@/lib/crypto/token-encryption";
import { prisma } from "@/lib/db/prisma";
import { verifyMetaWebhookSignature } from "@/lib/meta/webhook-signature";
import { messengerService } from "@/lib/messaging/messenger/service";

function getAppSecret(): string {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET is not configured");
  return secret;
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const agentId = req.nextUrl.searchParams.get("agentId");

  if (!mode || !token || !challenge) {
    return new Response("Missing verification parameters", { status: 400 });
  }

  if (mode !== "subscribe") {
    return new Response("Unsupported mode", { status: 400 });
  }

  if (!agentId) {
    return new Response("Missing agentId", { status: 400 });
  }

  const connection = await prisma.messengerConnection.findFirst({
    where: { agentId },
    select: { verifyTokenEnc: true },
  });
  if (!connection) {
    return new Response("Not connected", { status: 404 });
  }

  const expected = decryptToken(connection.verifyTokenEnc);
  if (token !== expected) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    const signature = req.headers.get("x-hub-signature-256");

    const ok = verifyMetaWebhookSignature({
      appSecret: getAppSecret(),
      rawBody: raw,
      signatureHeader: signature,
    });

    if (!ok) {
      return new Response("Invalid signature", { status: 403 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString("utf8")) as unknown;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const payload = parsed as { object?: string };
    if (payload.object !== "page") {
      return new Response("Ignored", { status: 200 });
    }

    await messengerService.handleMessengerWebhookEvent(parsed as any);

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[meta-messenger-webhook] Error:", msg);
    return new Response("OK", { status: 200 });
  }
}

