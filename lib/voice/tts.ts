import type { SpeechResult, VoiceParams } from "@/lib/voice/types";
import { BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";
import { LANGUAGE_VOICE_MAP } from "@/lib/voice/types";
import { resolvePersonaTtsVoice } from "@/lib/voice/voice-catalog";
import { prisma } from "@/lib/db/prisma";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

export async function synthesizeSpeech(
  text: string,
  voice: string = "alloy",
  model: string = "openai/gpt-4o-mini-tts-2025-12-15",
): Promise<SpeechResult> {
  const apiKey = getApiKey();

  const res = await fetch(`${OPENROUTER_BASE}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": BRAND_URL,
      "X-Title": BRAND_NAME,
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TTS API error (${res.status}): ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    audioBase64: base64,
    format: "mp3",
  };
}

const MAX_TTS_CHARS = 4096;

function splitText(text: string): string[] {
  if (text.length <= MAX_TTS_CHARS) return [text];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > MAX_TTS_CHARS) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export async function synthesizeSpeechLong(
  text: string,
  voice: string = "alloy",
  model: string = "openai/gpt-4o-mini-tts-2025-12-15",
): Promise<SpeechResult> {
  const chunks = splitText(text);
  if (chunks.length === 1) {
    return synthesizeSpeech(text, voice, model);
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const result = await synthesizeSpeech(chunk, voice, model);
    buffers.push(Buffer.from(result.audioBase64, "base64"));
  }

  const combined = Buffer.concat(buffers);
  return {
    audioBase64: combined.toString("base64"),
    format: "mp3",
  };
}

const TTS_DEFAULT_MODEL = "openai/gpt-4o-mini-tts-2025-12-15";

export async function resolveAgentVoice(
  agentId: string | null,
  language: string,
): Promise<VoiceParams> {
  const fallbackVoice = LANGUAGE_VOICE_MAP[language] ?? "alloy";
  const fallback: VoiceParams = {
    model: TTS_DEFAULT_MODEL,
    voice: fallbackVoice,
  };

  if (!agentId) return fallback;

  try {
    const primary = await prisma.agentVoice.findFirst({
      where: { agentId, isPrimary: true },
      select: { provider: true, voiceId: true, name: true },
    });

    if (primary?.provider === "OPENROUTER" && primary.voiceId) {
      const model =
        primary.name.includes("/") ? primary.name : TTS_DEFAULT_MODEL;
      return {
        model,
        voice: resolvePersonaTtsVoice(primary.voiceId),
      };
    }

    const variables = await prisma.agentVariable.findMany({
      where: { agentId, key: { in: ["tts_model", "tts_voice"] } },
    });

    const modelVar = variables.find((v) => v.key === "tts_model");
    const voiceVar = variables.find((v) => v.key === "tts_voice");

    if (modelVar || voiceVar) {
      return {
        model: modelVar?.value ?? TTS_DEFAULT_MODEL,
        voice: voiceVar?.value ?? fallbackVoice,
      };
    }

    const channel = await prisma.agentChannel.findFirst({
      where: { agentId, channel: "VOICE_CALLS", enabled: true },
      select: { config: true },
    });

    const cfg = channel?.config as Record<string, unknown> | null;
    if (cfg?.ttsModel || cfg?.ttsVoice) {
      return {
        model: String(cfg.ttsModel ?? TTS_DEFAULT_MODEL),
        voice: String(cfg.ttsVoice ?? fallbackVoice),
      };
    }
  } catch {
    // fallback on error
  }

  return fallback;
}
