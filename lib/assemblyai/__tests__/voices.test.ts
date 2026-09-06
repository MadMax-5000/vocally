import { describe, expect, it } from "vitest";

import { resolveAssemblyAiVoice } from "@/lib/assemblyai/voices";

describe("resolveAssemblyAiVoice", () => {
  it("uses estelle for French", () => {
    expect(resolveAssemblyAiVoice({ languageCode: "fr" })).toBe("estelle");
  });

  it("uses alba for English by default", () => {
    expect(resolveAssemblyAiVoice({ languageCode: "en" })).toBe("alba");
  });

  it("honors a known English preferred voice", () => {
    expect(resolveAssemblyAiVoice({ languageCode: "en", preferredVoiceId: "anna" })).toBe("anna");
  });
});
