export type TranscriptionResult = {
  text: string;
  detectedLanguage: string;
  usage: { seconds: number; cost: number } | null;
};

export type SpeechResult = {
  audioBase64: string;
  format: "mp3" | "pcm";
};

export type VoicePipelineResult = {
  transcript: string;
  botContent: string;
  audioBase64: string;
  sessionId: string;
  detectedLanguage: string;
};

export type VoiceConfig = {
  sttModel: string;
  ttsModel: string;
  ttsVoice: string;
};

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  sttModel: "openai/whisper-1",
  ttsModel: "openai/gpt-4o-mini-tts-2025-12-15",
  ttsVoice: "alloy",
};

export const LANGUAGE_VOICE_MAP: Record<string, string> = {
  ar: "alloy",
  ary: "alloy",
  fr: "nova",
  en: "alloy",
};
