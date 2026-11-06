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

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId, visitorId, widgetToken, deployment } = parsed.data;

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

    const sessions = await prisma.session.findMany({
      where: {
        orgId: access.orgId,
        agentId,
        visitorId,
        channel: "CHAT",
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          id: session.id,
          title: session.title,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
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
