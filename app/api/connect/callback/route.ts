import { NextRequest, NextResponse } from "next/server";
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

  if (!agentId || !channel || !connected || !accountId) {
    return NextResponse.redirect(
      new URL("/dashboard/agents?error=Missing OAuth parameters", req.url),
    );
  }

  if (!SUPPORTED_PLATFORMS.includes(connected)) {
    return NextResponse.redirect(
      new URL(`/dashboard/agents/${agentId}?error=Unsupported platform`, req.url),
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { orgId: true },
  });
  if (!agent) {
    return NextResponse.redirect(
      new URL("/dashboard/agents?error=Agent not found", req.url),
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: agent.orgId },
    select: { plan: true },
  });
  if (!org || !SOCIAL_CHANNELS_ENABLED[org.plan as keyof typeof SOCIAL_CHANNELS_ENABLED]) {
    return NextResponse.redirect(
      new URL(`/dashboard/agents/${agentId}?error=Social channels not available on your plan`, req.url),
    );
  }

  const channelType = CHANNEL_REDIRECTS[channel];
  if (!channelType) {
    return NextResponse.redirect(
      new URL(`/dashboard/agents/${agentId}?error=Invalid channel`, req.url),
    );
  }

  await prisma.zernioChannel.upsert({
    where: { accountId },
    update: { agentId, orgId: agent.orgId, channelType: channel as any, platformUsername: username },
    create: { accountId, agentId, orgId: agent.orgId, channelType: channel as any, platformUsername: username },
  });

  const redirectPath = `/dashboard/agents/${agentId}/deploy/${channelType}`;

  return NextResponse.redirect(new URL(redirectPath, req.url));
}
