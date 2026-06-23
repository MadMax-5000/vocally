import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { handleAgentChatMessage } from "@/lib/api/agent-chat-handler";
import { getOrgPrismaId } from "@/lib/server/organization";
import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";

const chatRequestSchema = z.object({
  agentId: z.string().min(1),
  widgetToken: z.string().min(1).optional(),
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(4000),
  deployment: z.enum(["widget", "help"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      agentId,
      widgetToken,
      sessionId: existingSessionId,
      message,
      deployment = "widget",
    } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        org: { select: { id: true, name: true } },
        channels: { where: { channel: "WEB_CHAT" } },
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const dbOrgId = await getOrgPrismaId();
    const isOwnerPreview = !!dbOrgId && agent.orgId === dbOrgId;

    if (!isOwnerPreview) {
      if (!widgetToken || !agent.widgetToken || agent.widgetToken !== widgetToken) {
        return NextResponse.json({ success: false, error: "Invalid widget token" }, { status: 401 });
      }

      if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") {
        return NextResponse.json({ success: false, error: "Agent not available" }, { status: 403 });
      }

      const webChatChannel = agent.channels[0];
      if (!webChatChannel?.enabled) {
        return NextResponse.json(
          { success: false, error: "Web chat is not enabled for this agent" },
          { status: 403 },
        );
      }

      if (deployment === "help") {
        const config = parseWebChatConfig(webChatChannel.config);
        if (config.helpPage?.enabled === false) {
          return NextResponse.json(
            { success: false, error: "Help page is not enabled for this agent" },
            { status: 403 },
          );
        }
      }
    }

    const orgId = agent.org.id;

    const result = await handleAgentChatMessage({
      orgId,
      agentId,
      sessionId: existingSessionId,
      message,
      deployment,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: result.error.status },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
