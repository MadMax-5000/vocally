import { NextRequest, NextResponse } from "next/server";

import { absoluteUrl } from "@/lib/app-url";
import { MAX_SOCIAL_ACCOUNTS } from "@/lib/billing/plan-features";
import { prisma } from "@/lib/db/prisma";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  agentDetailPath,
  agentsListPath,
  normalizeZernioChannel,
  resolveCallbackLocale,
  socialDeployPath,
  toPrismaChannel,
  zernioDeploySlug,
  type ZernioSocialChannel,
} from "@/lib/integrations/zernio/oauth-callback";
import { logServerError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = resolveCallbackLocale(
    searchParams.get("locale"),
    getRequestLocale(req.headers),
  );

  const agentId = searchParams.get("agentId");
  const channelParam = searchParams.get("channel");
  const connected = searchParams.get("connected");
  const accountId = searchParams.get("accountId");
  const username = searchParams.get("username");
  const error = searchParams.get("error");
  const resolvedChannel: ZernioSocialChannel | null =
    normalizeZernioChannel(channelParam) ?? normalizeZernioChannel(connected);
  const deploySlug = resolvedChannel ? zernioDeploySlug(resolvedChannel) : "whatsapp";

  const redirectTo = (path: string) => NextResponse.redirect(absoluteUrl(path, req));

  if (error) {
    const msg = searchParams.get("error_message") ?? error;
    const path = agentId
      ? socialDeployPath(locale, agentId, deploySlug, msg)
      : agentsListPath(locale, msg);
    return redirectTo(path);
  }

  if (!agentId || !accountId || !resolvedChannel) {
    const path = agentId
      ? agentDetailPath(locale, agentId, "Missing OAuth parameters")
      : agentsListPath(locale, "Missing OAuth parameters");
    return redirectTo(path);
  }

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { orgId: true },
    });
    if (!agent) {
      return redirectTo(agentsListPath(locale, "Agent not found"));
    }

    const org = await prisma.organization.findUnique({
      where: { id: agent.orgId },
      select: { plan: true },
    });
    const plan = org?.plan ?? "FREE";
    const maxAccounts =
      MAX_SOCIAL_ACCOUNTS[plan as keyof typeof MAX_SOCIAL_ACCOUNTS] ?? 0;
    if (maxAccounts <= 0) {
      return redirectTo(
        agentDetailPath(locale, agentId, "Social channels not available on your plan"),
      );
    }

    const connected = await prisma.zernioChannel.count({ where: { orgId: agent.orgId } });
    if (connected >= maxAccounts) {
      return redirectTo(
        agentDetailPath(
          locale,
          agentId,
          `Account limit reached (${maxAccounts} on your plan). Contact sales to add more.`,
        ),
      );
    }

    const channelType = toPrismaChannel(resolvedChannel);

    await prisma.zernioChannel.upsert({
      where: { accountId },
      update: {
        agentId,
        orgId: agent.orgId,
        channelType,
        platformUsername: username,
      },
      create: {
        accountId,
        agentId,
        orgId: agent.orgId,
        channelType,
        platformUsername: username,
      },
    });

    return redirectTo(socialDeployPath(locale, agentId, deploySlug));
  } catch (err) {
    logServerError("zernio_oauth_callback_failed", {
      agentId,
      channel: resolvedChannel,
      error: err instanceof Error ? err.message : "unknown",
    });
    return redirectTo(socialDeployPath(locale, agentId, deploySlug, "connection_failed"));
  }
}
