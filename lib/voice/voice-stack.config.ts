export const VOICE_STACK_CONFIG = {
  OPENAI_MODEL: "gpt-realtime-2", // Vapi API value: gpt-realtime-2025-08-28
  OPENAI_CASCADED_MODEL: "gpt-4o",
  VAPI_PROVIDER: "vapi",
  TELEPHONY_PROVIDER: "twilio",
  VOICE_PROVIDER: "elevenlabs",
  SUPPORTED_LANGUAGES: ["en", "fr", "ar", "darija"] as const,
  FALLBACK_LANGUAGE: "ar",
  DARIJA_PRODUCTION_ENABLED: false, // flip only after real-world tests pass
  CRM_INTEGRATIONS: [
    "vocally_internal", // Ticket, Appointment, AgentLead, FormSubmission (Postgres)
  ],
  LOGGING: true,
  TRANSCRIPTS: true,
  HUMAN_HANDOFF: true,
  PIPELINES: {
    realtime: {
      model: { provider: "openai", model: "gpt-realtime-2025-08-28" },
      voice: { provider: "openai", voiceId: "alloy" },
      languages: ["en", "fr"],
    },
    cascaded: {
      transcriber: { provider: "gladia", model: "solaria-1" },
      model: { provider: "openai", model: "gpt-4o" },
      voice: {
        provider: "11labs",
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah — test against Darija samples before go-live
        model: "eleven_multilingual_v2",
      },
      languages: ["ar", "darija"],
    },
  },
  DARIJA_VALIDATION: {
    minConfidence: 0.72,
    samplePhrasesRequired: 50,
    fallbackOnLowConfidence: "ar", // or "fr" per org policy
  },
} as const;
