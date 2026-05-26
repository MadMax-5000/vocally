import { NextRequest, NextResponse } from "next/server";

import { decodePubSubData, handleGmailPubSubNotification } from "@/lib/gmail/inbound";
import { verifyPubSubPushToken } from "@/lib/gmail/pubsub-verify";
import { logServerError, logServerWarning } from "@/lib/logger";

type PubSubEnvelope = {
  message?: {
    data?: string;
    messageId?: string;
  };
  subscription?: string;
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const verified = await verifyPubSubPushToken(authHeader);
  if (!verified) {
    logServerWarning("gmail_pubsub_unauthorized", {});
    return new Response("Unauthorized", { status: 401 });
  }

  let body: PubSubEnvelope;
  try {
    body = (await req.json()) as PubSubEnvelope;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const data = body.message?.data;
  if (!data) {
    return new Response("OK", { status: 200 });
  }

  const notification = decodePubSubData(data);
  if (!notification) {
    return new Response("OK", { status: 200 });
  }

  try {
    await handleGmailPubSubNotification(notification);
  } catch (e) {
    logServerError("gmail_pubsub_handler_failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
  }

  return new Response("OK", { status: 200 });
}
