import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { buildMetaAuthUrl } from "@/lib/meta/oauth";
import { getOrgPrismaId } from "@/lib/server/organization";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const orgId = await getOrgPrismaId();
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return new Response("Missing agentId", { status: 400 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { id: true },
  });
  if (!agent) {
    return new Response("Agent not found", { status: 404 });
  }

  try {
    const url = buildMetaAuthUrl(agentId, orgId);
    return NextResponse.redirect(url);
  } catch (e) {
    const message = e instanceof Error ? e.message : "OAuth not configured";
    const locale = getRequestLocale(req.headers);
    const redirect = new URL(`/${locale}/dashboard/agents/${agentId}/deploy/messenger`, req.url);
    redirect.searchParams.set("error", message);
    return NextResponse.redirect(redirect);
  }
}

