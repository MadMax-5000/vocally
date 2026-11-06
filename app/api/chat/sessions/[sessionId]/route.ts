import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authorizeWebChatRequest } from "@/lib/agent-security/web-chat-access";
import { prisma } from "@/lib/db/prisma";

const querySchema = z.object({
  agentId: z.string().min(1),
  visitorId: z.string().min(8).max(64),
  widgetToken: z.string().min(1).optional(),
  deployment: z.enum(["widget", "help"]).optional(),
});

const paramsSchema = z.object({
  sessionId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const parsedParams = paramsSchema.safeParse(params);
    const parsedQuery = querySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    if (!parsedParams.success || !parsedQuery.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const { sessionId } = parsedParams.data;
    const { agentId, visitorId, widgetToken, deployment } = parsedQuery.data;

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

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        orgId: access.orgId,
        agentId,
        visitorId,
        channel: "CHAT",
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          status: session.status,
          updatedAt: session.updatedAt.toISOString(),
        },
        messages: session.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
