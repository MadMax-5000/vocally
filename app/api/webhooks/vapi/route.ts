import { NextResponse } from "next/server";
import crypto from "crypto";
import { handleVapiWebhook } from "@/lib/vapi/webhook-handler";
import { logServerWarning } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-vapi-signature");
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (secret && signature) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const isValid = signature === expected || signature === `sha256=${expected}`;
      
      if (!isValid) {
        logServerWarning("[Vapi Webhook] Invalid signature", { source: "webhook-verify" });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (secret && !signature) {
      logServerWarning("[Vapi Webhook] Missing signature — webhook secret is set but no x-vapi-signature header", { source: "webhook-verify" });
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const response = await handleVapiWebhook(payload);
    
    // Vapi webhooks may require JSON responses (like for assistant-request or tool-calls)
    if (response) {
      return NextResponse.json(response);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerWarning("[Vapi Webhook Error]", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
