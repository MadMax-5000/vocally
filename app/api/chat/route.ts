import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authorizeWebChatRequest } from "@/lib/agent-security/web-chat-access";
import {
  handleAgentChatMessage,
  createAgentChatSseStream,
} from "@/lib/api/agent-chat-handler";

const chatRequestSchema = z.object({
  agentId: z.string().min(1),
  widgetToken: z.string().min(1).optional(),
  sessionId: z.string().nullable().optional(),
  visitorId: z.string().min(8).max(64).optional(),
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
      visitorId,
      message,
      deployment = "widget",
      context,
      stream: wantStream = false,
    } = parsed.data;

    const access = await authorizeWebChatRequest({
      req,
      agentId,
      widgetToken,
      deployment,
    });
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status },
      );
    }

    const { orgId } = access;

    if (wantStream) {
      const streamed = await createAgentChatSseStream({
        orgId,
        agentId,
        sessionId: existingSessionId,
        message,
        visitorId,
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
      visitorId,
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
