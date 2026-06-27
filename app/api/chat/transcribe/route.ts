import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getOrgPrismaId } from "@/lib/server/organization";
import {
  getWebChatHelpPageConfig,
  getWebChatWidgetConfig,
  parseWebChatConfig,
} from "@/lib/deploy/web-chat-config";
import { transcribeAudio, SttError } from "@/lib/voice/stt";

const MAX_AUDIO_BASE64_BYTES = 5 * 1024 * 1024;

const transcribeRequestSchema = z.object({
  agentId: z.string().min(1),
  widgetToken: z.string().min(1).optional(),
  audio: z.string().min(1),
  format: z.string().min(1),
  deployment: z.enum(["widget", "help"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = transcribeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId, widgetToken, audio, format, deployment = "widget" } = parsed.data;

    if (audio.length > MAX_AUDIO_BASE64_BYTES) {
      return NextResponse.json(
        { success: false, error: "Audio file too large" },
        { status: 400 },
      );
    }

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
    const isOwnerPreview = !!dbOrgId && agent.orgId === dbOrgId;

    const webChatChannel = agent.channels[0];
    const config = webChatChannel ? parseWebChatConfig(webChatChannel.config) : {};

    if (!isOwnerPreview) {
      if (!widgetToken || !agent.widgetToken || agent.widgetToken !== widgetToken) {
        return NextResponse.json({ success: false, error: "Invalid widget token" }, { status: 401 });
      }

      if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") {
        return NextResponse.json({ success: false, error: "Agent not available" }, { status: 403 });
      }

      if (!webChatChannel?.enabled) {
        return NextResponse.json(
          { success: false, error: "Web chat is not enabled for this agent" },
          { status: 403 },
        );
      }

      if (deployment === "help" && config.helpPage?.enabled === false) {
        return NextResponse.json(
          { success: false, error: "Help page is not enabled for this agent" },
          { status: 403 },
        );
      }
    }

    const voiceToTextEnabled =
      deployment === "help"
        ? (getWebChatHelpPageConfig(agent.channels).voiceToTextEnabled ?? false)
        : (getWebChatWidgetConfig(agent.channels).voiceToTextEnabled ?? false);

    if (!voiceToTextEnabled) {
      return NextResponse.json(
        { success: false, error: "Voice to text is not enabled for this agent" },
        { status: 403 },
      );
    }

    const result = await transcribeAudio(audio, format);

    if (!result.text.trim()) {
      return NextResponse.json(
        { success: false, error: "No speech detected" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text: result.text,
        detectedLanguage: result.detectedLanguage,
      },
    });
  } catch (err) {
    if (err instanceof SttError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
