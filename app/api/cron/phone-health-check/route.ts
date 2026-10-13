import { NextRequest, NextResponse } from "next/server";

import { runPhoneHealthCheck } from "@/lib/phone/health-check";
import { logServerError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPhoneHealthCheck();
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    logServerError("phone_health_check_cron_failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}