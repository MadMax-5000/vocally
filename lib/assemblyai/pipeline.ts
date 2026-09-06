import type { SupportedLanguage } from "@prisma/client";

export type VoicePipeline = "assemblyai" | "vapi";

export type PipelineInput = {
  defaultLanguage: SupportedLanguage;
  languages?: SupportedLanguage[];
  /** Phone channel config.language: auto | en | fr | ar | darija | ... */
  phoneLanguage?: string | null;
  assemblyAiConfigured?: boolean;
};

function normalizePhoneLanguage(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hasArabic(languages: SupportedLanguage[] | undefined, defaultLanguage: SupportedLanguage): boolean {
  if (defaultLanguage === "ARABIC" || defaultLanguage === "DARIJA") return true;
  return (languages ?? []).some((lang) => lang === "ARABIC" || lang === "DARIJA");
}

/**
 * EN/FR-only agents with a pinned phone language go to AssemblyAI.
 * Arabic, Darija, auto, or any agent that includes Arabic stays on Vapi.
 */
export function resolveVoicePipeline(input: PipelineInput): VoicePipeline {
  if (input.assemblyAiConfigured === false) return "vapi";

  const phone = normalizePhoneLanguage(input.phoneLanguage);

  if (phone === "ar" || phone === "arabic" || phone === "ary" || phone === "darija") {
    return "vapi";
  }
  if (hasArabic(input.languages, input.defaultLanguage)) {
    return "vapi";
  }
  if (phone === "en" || phone === "english" || phone === "fr" || phone === "french") {
    return "assemblyai";
  }
  if (
    (phone === "auto" || phone === "") &&
    (input.defaultLanguage === "ENGLISH" || input.defaultLanguage === "FRENCH")
  ) {
    return "assemblyai";
  }

  return "vapi";
}

export function usesAssemblyAiVoicePipeline(input: PipelineInput): boolean {
  return resolveVoicePipeline(input) === "assemblyai";
}
