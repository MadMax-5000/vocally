import { describe, expect, it } from "vitest";

import { resolveVoicePipeline, usesAssemblyAiVoicePipeline } from "@/lib/assemblyai/pipeline";

describe("resolveVoicePipeline", () => {
  it("uses AssemblyAI for English-only agents with auto phone language", () => {
    expect(
      resolveVoicePipeline({
        defaultLanguage: "ENGLISH",
        languages: ["ENGLISH"],
        phoneLanguage: "auto",
        assemblyAiConfigured: true,
      }),
    ).toBe("assemblyai");
  });

  it("uses AssemblyAI when phone language is pinned to fr", () => {
    expect(
      resolveVoicePipeline({
        defaultLanguage: "FRENCH",
        languages: ["FRENCH"],
        phoneLanguage: "fr",
        assemblyAiConfigured: true,
      }),
    ).toBe("assemblyai");
  });

  it("keeps Vapi when the agent includes Arabic", () => {
    expect(
      resolveVoicePipeline({
        defaultLanguage: "ENGLISH",
        languages: ["ENGLISH", "ARABIC"],
        phoneLanguage: "en",
        assemblyAiConfigured: true,
      }),
    ).toBe("vapi");
  });

  it("keeps Vapi for Darija default language", () => {
    expect(
      resolveVoicePipeline({
        defaultLanguage: "DARIJA",
        languages: ["DARIJA"],
        phoneLanguage: "auto",
        assemblyAiConfigured: true,
      }),
    ).toBe("vapi");
  });

  it("keeps Vapi when phone language is Arabic", () => {
    expect(
      resolveVoicePipeline({
        defaultLanguage: "ENGLISH",
        languages: ["ENGLISH"],
        phoneLanguage: "ar",
        assemblyAiConfigured: true,
      }),
    ).toBe("vapi");
  });

  it("keeps Vapi when AssemblyAI is not configured", () => {
    expect(
      usesAssemblyAiVoicePipeline({
        defaultLanguage: "ENGLISH",
        languages: ["ENGLISH"],
        phoneLanguage: "en",
        assemblyAiConfigured: false,
      }),
    ).toBe(false);
  });
});
