import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  extractBearerToken,
  handleAgentChatMessage,
  verifyAgentApiAccess,
} from "@/lib/api/agent-chat-handler";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().nullable().optional(),
  apiToken: z.string().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } },
) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId } = params;
    const bearerToken =
      extractBearerToken(req.headers.get("authorization")) ?? parsed.data.apiToken;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        org: { select: { id: true } },
        channels: { where: { channel: "WEB_CHAT" } },
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const dbOrgId = await getOrgPrismaId();
    const accessError = verifyAgentApiAccess(
      agent,
      bearerToken,
      agent.channels,
      dbOrgId,
    );

    if (accessError) {
      return NextResponse.json(
        { success: false, error: accessError.message },
        { status: accessError.status },
      );
    }

    const result = await handleAgentChatMessage({
      orgId: agent.org.id,
      agentId,
      sessionId: parsed.data.sessionId,
      message: parsed.data.message,
      deployment: "widget",
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: result.error.status },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
