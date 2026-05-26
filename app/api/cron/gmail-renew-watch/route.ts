import { NextRequest, NextResponse } from "next/server";

import { renewExpiringWatches } from "@/lib/gmail/watch";
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
    const result = await renewExpiringWatches(48);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    logServerError("gmail_renew_watch_cron_failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Renew failed" }, { status: 500 });
  }
}
