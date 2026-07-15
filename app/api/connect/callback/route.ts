import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

  if (connected !== "instagram" && connected !== "facebook") {
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

  const channelType = channel === "INSTAGRAM" || channel === "MESSENGER" ? channel : null;
  if (!channelType) {
    return NextResponse.redirect(
      new URL(`/dashboard/agents/${agentId}?error=Invalid channel`, req.url),
    );
  }

  await prisma.zernioChannel.upsert({
    where: { accountId },
    update: { agentId, orgId: agent.orgId, channelType, platformUsername: username },
    create: { accountId, agentId, orgId: agent.orgId, channelType, platformUsername: username },
  });

  const redirectPath =
    channelType === "INSTAGRAM"
      ? `/dashboard/agents/${agentId}/deploy/instagram`
      : `/dashboard/agents/${agentId}/deploy/messenger`;

  return NextResponse.redirect(new URL(redirectPath, req.url));
}
