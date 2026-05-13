import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { processMessage } from "@/lib/ai/process-message";

const chatRequestSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(4000),
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

    const { agentId, sessionId: existingSessionId, message } = parsed.data;

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

    const webChatChannel = agent.channels[0];
    if (!webChatChannel?.enabled) {
      return NextResponse.json(
        { success: false, error: "Web chat is not enabled for this agent" },
        { status: 403 },
      );
    }

    const orgId = agent.org.id;

    let sessionId = existingSessionId;
    if (sessionId) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session || session.orgId !== orgId) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }
    } else {
      const session = await prisma.session.create({
        data: {
          orgId,
          agentId,
          channel: "CHAT",
          status: "ACTIVE",
          language: "auto",
        },
      });
      sessionId = session.id;
    }

    const userMessage = await prisma.message.create({
      data: { sessionId, role: "USER", content: message },
    });

    const { botContent } = await processMessage({
      orgId,
      agentId,
      sessionId,
      message,
    });

    const botMessage = await prisma.message.create({
      data: { sessionId, role: "BOT", content: botContent },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        userMessage: {
          id: userMessage.id,
          role: "USER",
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        message: {
          id: botMessage.id,
          role: "BOT",
          content: botMessage.content,
          createdAt: botMessage.createdAt.toISOString(),
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
