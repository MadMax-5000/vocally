export type AssemblyAiVoiceId =
  | "alba"
  | "estelle"
  | "eve"
  | "george"
  | "jane"
  | "jean"
  | "mary"
  | "michael"
  | "anna"
  | "charles"
  | "paul"
  | "vera";

const EN_VOICES = new Set<string>([
  "alba",
  "eve",
  "george",
  "jane",
  "jean",
  "mary",
  "michael",
  "anna",
  "charles",
  "paul",
  "vera",
]);

export function resolveAssemblyAiVoice(params: {
  languageCode: "en" | "fr";
  preferredVoiceId?: string | null;
}): AssemblyAiVoiceId {
  if (params.languageCode === "fr") return "estelle";
  const preferred = params.preferredVoiceId?.trim().toLowerCase();
  if (preferred && EN_VOICES.has(preferred)) {
    return preferred as AssemblyAiVoiceId;
  }
  return "alba";
}
