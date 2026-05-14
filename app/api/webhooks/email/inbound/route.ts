import { NextRequest } from "next/server";
import { emailService } from "@/lib/email/service";
import type { InboundEmailPayload } from "@/lib/email/email-types";

export async function POST(req: NextRequest) {
  try {
    const body: InboundEmailPayload = await req.json();

    if (!body.from || !body.to || body.to.length === 0) {
      return new Response("Missing required fields", { status: 400 });
    }

    await emailService.handleInboundEmail(body);

    return new Response("OK", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email-inbound-webhook] Error:", message);
    return new Response("OK", { status: 200 });
  }
}
