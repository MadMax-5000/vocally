import type { TranscriptionResult } from "@/lib/voice/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

function normalizeFormat(raw: string): string {
  return raw.replace(/^audio\//, "").replace(/;.*$/, "").trim();
}

export async function transcribeAudio(
  audioBase64: string,
  format: string,
  language?: string,
  model: string = "openai/whisper-1",
): Promise<TranscriptionResult> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model,
    input_audio: {
      data: audioBase64,
      format: normalizeFormat(format),
    },
  };

  if (language) {
    body.language = language;
  }

  const res = await fetch(`${OPENROUTER_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vocally.app",
      "X-Title": "Vocally",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[stt] API error", res.status, text);
    throw new Error(`STT API error (${res.status}): ${text}`);
  }

  const json = await res.json();

  return {
    text: json.text ?? "",
    detectedLanguage: json.language ?? language ?? "unknown",
    usage: json.usage
      ? {
          seconds: json.usage.seconds ?? 0,
          cost: json.usage.cost ?? 0,
        }
      : null,
  };
}
