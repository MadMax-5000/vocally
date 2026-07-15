import { NextRequest } from "next/server";
import { verifyFiwanoSignature } from "@/lib/fiwano/verify";
import { handleFiwanoInbound } from "@/lib/fiwano/inbound";

export async function GET(req: NextRequest) {
  return new Response("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-webhook-signature");

  if (!verifyFiwanoSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    await handleFiwanoInbound(payload);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Fiwano webhook error:", err);
    return new Response("OK", { status: 200 });
  }
}
