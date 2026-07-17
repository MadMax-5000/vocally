import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { buildGoogleAuthUrl } from "@/lib/gmail/oauth";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { EMAIL_CHANNEL_ENABLED } from "@/lib/billing/plan-features";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const orgId = await getOrgPrismaId();
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org || !EMAIL_CHANNEL_ENABLED[org.plan as keyof typeof EMAIL_CHANNEL_ENABLED]) {
    const locale = getRequestLocale(req.headers);
    return NextResponse.redirect(new URL(`/${locale}/dashboard/agents`, req.url));
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
    const url = buildGoogleAuthUrl(agentId, orgId);
    return NextResponse.redirect(url);
  } catch (e) {
    const message = e instanceof Error ? e.message : "OAuth not configured";
    const locale = getRequestLocale(req.headers);
    const redirect = new URL(`/${locale}/dashboard/agents/${agentId}/deploy/email`, req.url);
    redirect.searchParams.set("error", message);
    return NextResponse.redirect(redirect);
  }
}
