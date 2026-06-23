import { NextResponse } from "next/server";
import crypto from "crypto";
import { handleVapiWebhook } from "@/lib/vapi/webhook-handler";

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
        console.warn("[Vapi Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (secret && req.headers.get("x-vapi-secret") !== secret && !signature) {
      // Fallback for legacy X-Vapi-Secret
      console.warn("[Vapi Webhook] Invalid secret");
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const response = await handleVapiWebhook(payload);
    
    // Vapi webhooks may require JSON responses (like for assistant-request or tool-calls)
    if (response) {
      return NextResponse.json(response);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vapi Webhook Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
