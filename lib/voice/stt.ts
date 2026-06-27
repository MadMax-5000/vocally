import type { TranscriptionResult } from "@/lib/voice/types";
import { logServerError } from "@/lib/logger";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export class SttError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SttError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new SttError("OPENROUTER_API_KEY is not configured", 503);
  return key;
}

function normalizeFormat(raw: string): string {
  return raw.replace(/^audio\//, "").replace(/;.*$/, "").trim();
}

function parseSttFailure(status: number, body: string): SttError {
  if (status === 402) {
    return new SttError(
      "Voice transcription requires OpenRouter credits. Add at least $0.50 at openrouter.ai/settings/credits.",
      402,
    );
  }

  let detail = "";
  try {
    const json = JSON.parse(body) as { error?: { message?: string } };
    detail = json.error?.message ?? "";
  } catch {
    detail = body.slice(0, 200);
  }

  const message = detail
    ? `Transcription failed: ${detail}`
    : `Transcription failed (${status})`;

  return new SttError(message, status >= 400 && status < 600 ? status : 502);
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
    logServerError("stt.api_error", { status: res.status });
    throw parseSttFailure(res.status, text);
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
