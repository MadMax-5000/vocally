import { NextRequest, NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db/prisma";
import { SOCIAL_CHANNELS_ENABLED } from "@/lib/billing/plan-features";

const SUPPORTED_PLATFORMS = ["instagram", "facebook", "whatsapp"];

const CHANNEL_REDIRECTS: Record<string, string> = {
  INSTAGRAM: "instagram",
  MESSENGER: "messenger",
  WHATSAPP: "whatsapp",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const agentId = searchParams.get("agentId");
  const channel = searchParams.get("channel");
  const connected = searchParams.get("connected");
  const accountId = searchParams.get("accountId");
  const username = searchParams.get("username");
  const error = searchParams.get("error");

  if (error) {
    const msg = searchParams.get("error_message") ?? error;
    const deploySlug = CHANNEL_REDIRECTS[channel ?? ""] ?? "whatsapp";
    const path = agentId
      ? `/dashboard/agents/${agentId}/deploy/${deploySlug}?error=${encodeURIComponent(msg)}`
      : `/dashboard/agents?error=${encodeURIComponent(msg)}`;
    return NextResponse.redirect(absoluteUrl(path, req));
  }

  if (!agentId || !channel || !connected || !accountId) {
    return NextResponse.redirect(
      absoluteUrl("/dashboard/agents?error=Missing OAuth parameters", req),
    );
  }

  if (!SUPPORTED_PLATFORMS.includes(connected)) {
    return NextResponse.redirect(
      absoluteUrl(`/dashboard/agents/${agentId}?error=Unsupported platform`, req),
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { orgId: true },
  });
  if (!agent) {
    return NextResponse.redirect(
      absoluteUrl("/dashboard/agents?error=Agent not found", req),
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: agent.orgId },
    select: { plan: true },
  });
  if (!org || !SOCIAL_CHANNELS_ENABLED[org.plan as keyof typeof SOCIAL_CHANNELS_ENABLED]) {
    return NextResponse.redirect(
      absoluteUrl(`/dashboard/agents/${agentId}?error=Social channels not available on your plan`, req),
    );
  }

  const channelType = CHANNEL_REDIRECTS[channel];
  if (!channelType) {
    return NextResponse.redirect(
      absoluteUrl(`/dashboard/agents/${agentId}?error=Invalid channel`, req),
    );
  }

  await prisma.zernioChannel.upsert({
    where: { accountId },
    update: { agentId, orgId: agent.orgId, channelType: channel as any, platformUsername: username },
    create: { accountId, agentId, orgId: agent.orgId, channelType: channel as any, platformUsername: username },
  });

  const redirectPath = `/dashboard/agents/${agentId}/deploy/${channelType}`;

  return NextResponse.redirect(absoluteUrl(redirectPath, req));
}
