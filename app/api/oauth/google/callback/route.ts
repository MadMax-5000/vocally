import { NextRequest, NextResponse } from "next/server";

import { connectGmailForAgent } from "@/lib/gmail/connect";
import { verifyOAuthState } from "@/lib/gmail/oauth";
import { getOrgPrismaId } from "@/lib/server/organization";
import { logServerError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  const fallbackAgentId = state ? verifyOAuthState(state)?.agentId : null;
  const deployPath = fallbackAgentId
    ? `/dashboard/agents/${fallbackAgentId}/deploy/email`
    : "/dashboard";

  if (oauthError) {
    const redirect = new URL(deployPath, req.url);
    redirect.searchParams.set("error", oauthError);
    return NextResponse.redirect(redirect);
  }

  if (!code || !state) {
    const redirect = new URL(deployPath, req.url);
    redirect.searchParams.set("error", "missing_code");
    return NextResponse.redirect(redirect);
  }

  const payload = verifyOAuthState(state);
  if (!payload) {
    const redirect = new URL(deployPath, req.url);
    redirect.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(redirect);
  }

  const orgId = await getOrgPrismaId();
  if (!orgId || orgId !== payload.orgId) {
    const redirect = new URL(deployPath, req.url);
    redirect.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirect);
  }

  try {
    await connectGmailForAgent({
      orgId: payload.orgId,
      agentId: payload.agentId,
      code,
    });

    const redirect = new URL(`/dashboard/agents/${payload.agentId}/deploy/email`, req.url);
    redirect.searchParams.set("connected", "1");
    return NextResponse.redirect(redirect);
  } catch (e) {
    logServerError("gmail_oauth_callback_failed", {
      agentId: payload.agentId,
      error: e instanceof Error ? e.message : "unknown",
    });
    const redirect = new URL(`/dashboard/agents/${payload.agentId}/deploy/email`, req.url);
    redirect.searchParams.set(
      "error",
      e instanceof Error ? e.message : "connection_failed",
    );
    return NextResponse.redirect(redirect);
  }
}
