import g711 from "g711";
import wav from "node-wav";
import { BRAND_NAME, BRAND_URL } from "@/lib/constants/brand";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const TTS_DEFAULT_MODEL = "openai/gpt-4o-mini-tts-2025-12-15";
const TTS_DEFAULT_VOICE = "alloy";

const TWILIO_SAMPLE_RATE = 8000;
const CHUNK_DURATION_MS = 20;
const CHUNK_SIZE = (TWILIO_SAMPLE_RATE * CHUNK_DURATION_MS) / 1000;

export function computeRmsEnergy(ulawBuffer: Buffer): number {
  let sum = 0;
  const len = ulawBuffer.length;
  for (let i = 0; i < len; i++) {
    const signed = ulawBuffer[i]! - 128;
    sum += (signed / 128) * (signed / 128);
  }
  return Math.sqrt(sum / len);
}

export function ulawToPcm(ulawBuffer: Buffer): Int16Array {
  const samples = g711.ulawToPCM(ulawBuffer);
  return new Int16Array(samples);
}

export function pcmToUlaw(pcmBuffer: Int16Array): Uint8Array {
  return g711.ulawFromPCM(pcmBuffer) as Uint8Array;
}

export function downsamplePcm(
  input: Int16Array,
  fromRate: number,
  toRate: number,
): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.round(i * ratio);
    output[i] = input[Math.min(srcIndex, input.length - 1)]!;
  }
  return output;
}

export function chunkUlaw(ulaw: Uint8Array): Buffer[] {
  const chunks: Buffer[] = [];
  for (let i = 0; i < ulaw.length; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, ulaw.length);
    chunks.push(Buffer.from(ulaw.slice(i, end)));
  }
  return chunks;
}

export async function synthesizeSpeechWav(
  text: string,
  voice: string = TTS_DEFAULT_VOICE,
  model: string = TTS_DEFAULT_MODEL,
): Promise<Buffer> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

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
      response_format: "wav",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TTS API error (${res.status}): ${errText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export function wavToUlawChunks(wavBuffer: Buffer): Buffer[] {
  const decoded = wav.decode(wavBuffer);
  const channel0 = decoded.channelData[0]!;

  const pcm16 = new Int16Array(channel0.length);
  for (let i = 0; i < channel0.length; i++) {
    const s = channel0[i]! * 32767;
    pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(s)));
  }

  const downsampled = downsamplePcm(pcm16, decoded.sampleRate, TWILIO_SAMPLE_RATE);
  const ulaw = pcmToUlaw(downsampled);
  return chunkUlaw(ulaw);
}
