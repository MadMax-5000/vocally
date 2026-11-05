import { NextRequest } from "next/server";

import { decryptToken } from "@/lib/crypto/token-encryption";
import { prisma } from "@/lib/db/prisma";
import { HostawayError } from "@/lib/hostaway/errors";
import { handleHostawayInbound } from "@/lib/hostaway/inbound";
import { verifyHostawayWebhookAuth } from "@/lib/hostaway/webhook-auth";
import { logServerError, logServerWarning } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const connectionId = req.nextUrl.searchParams.get("connection");
  if (!connectionId) {
    return new Response("Missing connection", { status: 400 });
  }

  const connection = await prisma.hostawayConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection) {
    return new Response("Unknown connection", { status: 404 });
  }

  let expectedPassword: string;
  try {
    expectedPassword = decryptToken(connection.webhookPasswordEnc);
  } catch {
    logServerError("hostaway_webhook_secret_unreadable", { connectionId });
    return new Response("Webhook not configured", { status: 500 });
  }

  const authorized = verifyHostawayWebhookAuth(req.headers.get("authorization"), {
    login: connection.webhookLogin,
    password: expectedPassword,
  });
  if (!authorized) {
    logServerWarning("hostaway_webhook_unauthorized", { connectionId });
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = (await req.json()) as unknown;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    await handleHostawayInbound({ connection, payload });
    return new Response("OK", { status: 200 });
  } catch (err) {
    if (err instanceof HostawayError && err.status === 429) {
      const retryAfter = err.retryAfter
        ? Math.max(err.retryAfter - Math.floor(Date.now() / 1000), 1)
        : 60;
      return new Response("Rate limited", {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      });
    }

    const status = err instanceof HostawayError ? err.status : undefined;
    logServerError("hostaway_webhook_failed", {
      connectionId,
      status: status ?? 0,
    });

    await prisma.hostawayConnection
      .update({
        where: { id: connectionId },
        data: {
          lastError: "Webhook processing failed",
          lastErrorAt: new Date(),
        },
      })
      .catch(() => undefined);

    return new Response("Processing failed", { status: 500 });
  }
}
