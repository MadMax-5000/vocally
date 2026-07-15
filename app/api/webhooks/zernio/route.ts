import { NextRequest } from "next/server";
import { verifyZernioSignature } from "@/lib/zernio/verify";
import { handleZernioInbound } from "@/lib/zernio/inbound";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-Zernio-Signature");

  if (!verifyZernioSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    await handleZernioInbound(payload);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Zernio webhook error:", err);
    return new Response("OK", { status: 200 });
  }
}
