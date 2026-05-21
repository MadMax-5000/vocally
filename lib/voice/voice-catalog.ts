import { AVATAR_DATA } from "@/utils/lib/avatars";

export type VoicePersona = {
  voiceId: string;
  name: string;
};

export type VoicePersonaDetail = VoicePersona & {
  /** Short personality line shown after the name (e.g. "Calm, strategic, assured"). */
  tagline: string;
  /** Secondary line — best-use hint shown under the title. */
  description: string;
};

const PERSONA_COPY: Record<
  string,
  { tagline: string; description: string }
> = {
  omar: {
    tagline: "Calm, strategic, and assured",
    description: "Best for billing, escalations, and high-stakes support.",
  },
  lina: {
    tagline: "Warm, mindful, and caring",
    description: "Best for wellness, onboarding, and gentle customer care.",
  },
  nour: {
    tagline: "Bright, curious, and clear",
    description: "Best for FAQs, product tours, and knowledge-heavy chats.",
  },
  ziad: {
    tagline: "Precise, analytical, and crisp",
    description: "Best for status updates, tech support, and data questions.",
  },
  rima: {
    tagline: "Soft, empathetic, and patient",
    description: "Best for complaints, sensitive topics, and de-escalation.",
  },
  khalid: {
    tagline: "Confident, direct, and structured",
    description: "Best for IT issues, workflows, and step-by-step guidance.",
  },
  sana: {
    tagline: "Upbeat, creative, and expressive",
    description: "Best for marketing, promotions, and energetic brand voice.",
  },
  tariq: {
    tagline: "Steady, formal, and trustworthy",
    description: "Best for verification, security, and policy explanations.",
  },
  yasmin: {
    tagline: "Dreamy, elegant, and inviting",
    description: "Best for hospitality, luxury brands, and storytelling.",
  },
  faris: {
    tagline: "Bold, fast, and action-oriented",
    description: "Best for urgent requests, logistics, and no-nonsense resolution.",
  },
};

/** Selectable agent personas derived from AVATAR_DATA sphere identities. */
export const VOICE_PERSONAS: VoicePersona[] = AVATAR_DATA.map((a) => ({
  voiceId: a.id,
  name: a.en,
}));

/** Rich copy for voice picker UI. */
export const VOICE_PERSONA_DETAILS: VoicePersonaDetail[] = AVATAR_DATA.map((a) => {
  const copy = PERSONA_COPY[a.id] ?? {
    tagline: a.role,
    description: `Best for ${a.role.toLowerCase()} conversations.`,
  };
  return {
    voiceId: a.id,
    name: a.en,
    tagline: copy.tagline,
    description: copy.description,
  };
});

/** OpenRouter TTS voice names for each persona id (UI stores persona id in voiceId). */
export const PERSONA_TTS_VOICE_MAP: Record<string, string> = {
  omar: "alloy",
  lina: "nova",
  nour: "shimmer",
  ziad: "echo",
  rima: "coral",
  khalid: "onyx",
  sana: "fable",
  tariq: "ash",
  yasmin: "ballad",
  faris: "verse",
};

export const VOICE_PREVIEW_AUDIO_SRC = "/audio/piano-c4.wav";

export function getVoicePersona(voiceId: string): VoicePersona | undefined {
  return VOICE_PERSONAS.find((v) => v.voiceId === voiceId);
}

export function getVoicePersonaDetail(voiceId: string): VoicePersonaDetail | undefined {
  return VOICE_PERSONA_DETAILS.find((v) => v.voiceId === voiceId);
}

export function getVoicePersonaDisplayName(voiceId: string): string {
  return getVoicePersona(voiceId)?.name ?? voiceId;
}

/** Resolve persona id or raw OpenRouter voice name for TTS synthesis. */
export function resolvePersonaTtsVoice(voiceId: string): string {
  return PERSONA_TTS_VOICE_MAP[voiceId] ?? voiceId;
}
