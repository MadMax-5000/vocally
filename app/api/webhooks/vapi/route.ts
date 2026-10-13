import { NextResponse } from "next/server";
import crypto from "crypto";
import { handleVapiWebhook } from "@/lib/vapi/webhook-handler";
import { logServerWarning } from "@/lib/logger";
import {
  clientIpFromHeaders,
  consumeChatRateLimit,
} from "@/lib/agent-security/rate-limit";

const WEBHOOK_RATE_LIMIT_PER_MINUTE = 3000;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    if (!consumeChatRateLimit(`vapi-webhook:${ip}`, WEBHOOK_RATE_LIMIT_PER_MINUTE)) {
      logServerWarning("[Vapi Webhook] Rate limit exceeded", { source: "webhook-rate-limit", ip });
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-vapi-signature");
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (!secret) {
      logServerWarning(
        "[Vapi Webhook] Rejected — VAPI_WEBHOOK_SECRET is not configured (fail-closed)",
        { source: "webhook-verify" },
      );
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 },
      );
    }

    if (!signature) {
      logServerWarning(
        "[Vapi Webhook] Missing signature — no x-vapi-signature header",
        { source: "webhook-verify", ip },
      );
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const isValid = signature === expected || signature === `sha256=${expected}`;

    if (!isValid) {
      logServerWarning("[Vapi Webhook] Invalid signature", {
        source: "webhook-verify",
        ip,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const response = await handleVapiWebhook(payload);

    // Vapi webhooks may require JSON responses (like for assistant-request or tool-calls)
    if (response) {
      return NextResponse.json(response);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerWarning("[Vapi Webhook Error]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}