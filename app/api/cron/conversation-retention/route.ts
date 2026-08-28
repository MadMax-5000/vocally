import { NextRequest, NextResponse } from "next/server";

import { purgeExpiredConversations } from "@/lib/agent-security/retention";
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
    const result = await purgeExpiredConversations();
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    logServerError("conversation_retention_cron_failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
