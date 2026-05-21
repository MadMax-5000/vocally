import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { transcribeAudio } from "@/lib/voice/stt";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { processMessage } from "@/lib/ai/process-message";
import { LANGUAGE_VOICE_MAP, DEFAULT_VOICE_CONFIG } from "@/lib/voice/types";

const requestSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().nullable().optional(),
  audio: z.string().min(1),
  format: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId, sessionId: existingSessionId, audio, format } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { org: { select: { id: true, name: true } } },
    });

    if (!agent || agent.orgId !== orgId) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const transcription = await transcribeAudio(audio, format);
    const transcript = transcription.text;
    const detectedLanguage = transcription.detectedLanguage;

    if (!transcript.trim()) {
      return NextResponse.json(
        { success: false, error: "No speech detected" },
        { status: 400 },
      );
    }

    let sessionId = existingSessionId;
    if (sessionId) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session || session.orgId !== orgId) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }
      if (session.language === "auto" && detectedLanguage !== "unknown") {
        await prisma.session.update({
          where: { id: sessionId },
          data: { language: detectedLanguage },
        });
      }
    } else {
      const session = await prisma.session.create({
        data: {
          orgId,
          agentId,
          channel: "VOICE",
          status: "ACTIVE",
          language: detectedLanguage !== "unknown" ? detectedLanguage : "auto",
        },
      });
      sessionId = session.id;
    }

    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "USER",
        content: transcript,
      },
    });

    const { botContent } = await processMessage({
      orgId,
      agentId,
      sessionId,
      message: transcript,
      channel: "VOICE",
    });

    const selectedVoice =
      LANGUAGE_VOICE_MAP[detectedLanguage] ?? DEFAULT_VOICE_CONFIG.ttsVoice;

    const speech = await synthesizeSpeech(botContent, selectedVoice);

    const botMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "BOT",
        content: botContent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transcript,
        botContent,
        audioBase64: speech.audioBase64,
        sessionId,
        detectedLanguage,
        messages: {
          user: { id: userMessage.id, role: "USER", content: transcript, createdAt: userMessage.createdAt.toISOString() },
          bot: { id: botMessage.id, role: "BOT", content: botContent, createdAt: botMessage.createdAt.toISOString() },
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
