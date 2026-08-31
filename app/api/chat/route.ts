import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { handleAgentChatMessage, createAgentChatSseStream } from "@/lib/api/agent-chat-handler";
import { getOrgPrismaId } from "@/lib/server/organization";
import { parseWebChatConfig } from "@/lib/deploy/web-chat-config";
import {
  denyIfChatRateLimited,
  denyIfOriginNotAllowed,
} from "@/lib/agent-security/widget-access";

const chatRequestSchema = z.object({
  agentId: z.string().min(1),
  widgetToken: z.string().min(1).optional(),
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(4000),
  deployment: z.enum(["widget", "help"]).optional(),
  context: z.string().max(500).optional(),
  stream: z.boolean().optional(),
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
      context,
      stream: wantStream = false,
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

      const originDenial = denyIfOriginNotAllowed(req.headers, agent.allowedHostnames);
      if (originDenial) {
        return NextResponse.json(
          { success: false, error: originDenial.error },
          { status: originDenial.status },
        );
      }

      const rateDenial = denyIfChatRateLimited(
        req.headers,
        agent.id,
        agent.chatRateLimitPerMinute,
      );
      if (rateDenial) {
        return NextResponse.json(
          { success: false, error: rateDenial.error },
          { status: rateDenial.status },
        );
      }
    }

    const orgId = agent.org.id;

    if (wantStream) {
      const streamed = await createAgentChatSseStream({
        orgId,
        agentId,
        sessionId: existingSessionId,
        message,
        deployment,
        context,
      });

      if (!streamed.ok) {
        return NextResponse.json(
          { success: false, error: streamed.error.message },
          { status: streamed.error.status },
        );
      }

      return new Response(streamed.stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const result = await handleAgentChatMessage({
      orgId,
      agentId,
      sessionId: existingSessionId,
      message,
      deployment,
      context,
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
