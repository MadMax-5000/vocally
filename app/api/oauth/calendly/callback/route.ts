import { NextRequest, NextResponse } from "next/server";

import { connectCalendlyForAgent } from "@/lib/calendar/connect";
import { prisma } from "@/lib/db/prisma";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { logServerError } from "@/lib/logger";
import { verifyOAuthState } from "@/lib/oauth/signed-state";
import { getOrgPrismaId } from "@/lib/server/organization";

function actionsRedirect(req: NextRequest, locale: string, agentId: string) {
  return new URL(`/${locale}/dashboard/agents/${agentId}`, req.url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const locale = getRequestLocale(req.headers);

  const fallbackAgentId = state ? verifyOAuthState(state)?.agentId : null;
  const fallback = fallbackAgentId
    ? actionsRedirect(req, locale, fallbackAgentId)
    : new URL(`/${locale}/dashboard`, req.url);
  fallback.searchParams.set("tab", "actions");

  if (oauthError) {
    fallback.searchParams.set("error", oauthError);
    return NextResponse.redirect(fallback);
  }

  if (!code || !state) {
    fallback.searchParams.set("error", "missing_code");
    return NextResponse.redirect(fallback);
  }

  const payload = verifyOAuthState(state);
  if (!payload) {
    fallback.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(fallback);
  }

  const orgId = await getOrgPrismaId();
  if (!orgId || orgId !== payload.orgId) {
    const redirect = actionsRedirect(req, locale, payload.agentId);
    redirect.searchParams.set("tab", "actions");
    redirect.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirect);
  }

  const agent = await prisma.agent.findFirst({
    where: { id: payload.agentId, orgId },
    select: { id: true },
  });
  if (!agent) {
    const redirect = actionsRedirect(req, locale, payload.agentId);
    redirect.searchParams.set("tab", "actions");
    redirect.searchParams.set("error", "agent_not_found");
    return NextResponse.redirect(redirect);
  }

  try {
    await connectCalendlyForAgent({
      orgId: payload.orgId,
      agentId: payload.agentId,
      code,
    });
    const redirect = actionsRedirect(req, locale, payload.agentId);
    redirect.searchParams.set("tab", "actions");
    redirect.searchParams.set("calendar", "connected");
    return NextResponse.redirect(redirect);
  } catch (e) {
    logServerError("calendly_oauth_callback_failed", {
      agentId: payload.agentId,
      error: e instanceof Error ? e.message : "unknown",
    });
    const redirect = actionsRedirect(req, locale, payload.agentId);
    redirect.searchParams.set("tab", "actions");
    redirect.searchParams.set(
      "error",
      e instanceof Error ? e.message : "connection_failed",
    );
    return NextResponse.redirect(redirect);
  }
}
