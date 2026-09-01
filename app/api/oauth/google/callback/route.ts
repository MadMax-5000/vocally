import { NextRequest, NextResponse } from "next/server";

import { absoluteUrl } from "@/lib/app-url";
import { connectGmailForAgent } from "@/lib/gmail/connect";
import { verifyOAuthState } from "@/lib/gmail/oauth";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import { EMAIL_CHANNEL_ENABLED } from "@/lib/billing/plan-features";
import { logServerError } from "@/lib/logger";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const locale = getRequestLocale(req.headers);

  const fallbackAgentId = state ? verifyOAuthState(state)?.agentId : null;
  const deployPath = fallbackAgentId
    ? `/${locale}/dashboard/agents/${fallbackAgentId}/deploy/email`
    : `/${locale}/dashboard`;

  if (oauthError) {
    const redirect = absoluteUrl(deployPath, req);
    redirect.searchParams.set("error", oauthError);
    return NextResponse.redirect(redirect);
  }

  if (!code || !state) {
    const redirect = absoluteUrl(deployPath, req);
    redirect.searchParams.set("error", "missing_code");
    return NextResponse.redirect(redirect);
  }

  const payload = verifyOAuthState(state);
  if (!payload) {
    const redirect = absoluteUrl(deployPath, req);
    redirect.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(redirect);
  }

  const orgId = await getOrgPrismaId();
  if (!orgId || orgId !== payload.orgId) {
    const redirect = absoluteUrl(deployPath, req);
    redirect.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirect);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org || !EMAIL_CHANNEL_ENABLED[org.plan as keyof typeof EMAIL_CHANNEL_ENABLED]) {
    const redirect = absoluteUrl(deployPath, req);
    redirect.searchParams.set("error", "Email channel not available on your plan");
    return NextResponse.redirect(redirect);
  }

  try {
    await connectGmailForAgent({
      orgId: payload.orgId,
      agentId: payload.agentId,
      code,
    });

    const redirect = absoluteUrl(`/${locale}/dashboard/agents/${payload.agentId}/deploy/email`, req);
    redirect.searchParams.set("connected", "1");
    return NextResponse.redirect(redirect);
  } catch (e) {
    logServerError("gmail_oauth_callback_failed", {
      agentId: payload.agentId,
      error: e instanceof Error ? e.message : "unknown",
    });
    const redirect = absoluteUrl(`/${locale}/dashboard/agents/${payload.agentId}/deploy/email`, req);
    redirect.searchParams.set(
      "error",
      e instanceof Error ? e.message : "connection_failed",
    );
    return NextResponse.redirect(redirect);
  }
}
