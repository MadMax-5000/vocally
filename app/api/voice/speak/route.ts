import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech } from "@/lib/voice/tts";
import { LANGUAGE_VOICE_MAP, DEFAULT_VOICE_CONFIG } from "@/lib/voice/types";

const requestSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { text, voice, language } = parsed.data;
    const selectedVoice = voice ?? (language ? LANGUAGE_VOICE_MAP[language] : undefined) ?? DEFAULT_VOICE_CONFIG.ttsVoice;

    const result = await synthesizeSpeech(text, selectedVoice);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
