import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { buildMetaAuthUrl } from "@/lib/integrations/instagram/oauth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId")?.trim();
    if (!agentId) {
      return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
    }

    const orgId = await getOrgPrismaId();
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const url = buildMetaAuthUrl(agentId, orgId);
    return NextResponse.redirect(url);
  } catch (err) {
    const msg =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Failed to start Instagram connection";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

