import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/logger";

/**
 * Supabase free-tier keep-alive.
 *
 * Supabase pauses free projects after 7 days without sufficient *database*
 * activity (see https://supabase.com/docs/guides/platform/free-project-pausing).
 * Hitting this endpoint via Vercel Cron runs a real SQL query every day so the
 * project is never considered inactive. Note: merely fetching the project URL
 * or opening a connection does NOT count — an actual query must succeed.
 */
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
    const [organizationCount] = await Promise.all([
      prisma.organization.count(),
      prisma.$queryRaw`SELECT 1`,
    ]);

    return NextResponse.json({
      success: true,
      heartbeat: "ok",
      organizations: organizationCount,
      at: new Date().toISOString(),
    });
  } catch (e) {
    logServerError("supabase_keep_alive_cron_failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Keep-alive query failed" }, { status: 500 });
  }
}
