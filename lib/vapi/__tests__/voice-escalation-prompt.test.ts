import { describe, expect, it } from "vitest";

import { buildVoiceEscalationPromptSection } from "@/lib/vapi/voice-escalation-prompt";

describe("voice-escalation-prompt", () => {
  it("includes transfer instructions when handoff is available", () => {
    const section = buildVoiceEscalationPromptSection(
      { userRequested: true, negativeSentiment: false, aiFailure: false, unsupportedRequest: false },
      true,
    );
    expect(section).toContain("transfer_to_human");
    expect(section).toContain("human");
  });

  it("omits transfer tool guidance when handoff is unavailable", () => {
    const section = buildVoiceEscalationPromptSection(
      { userRequested: true, negativeSentiment: false, aiFailure: false, unsupportedRequest: false },
      false,
    );
    expect(section).not.toContain("transfer_to_human");
    expect(section).toContain("callback");
  });

  it("returns empty string when no triggers are enabled", () => {
    const section = buildVoiceEscalationPromptSection(
      {
        userRequested: false,
        negativeSentiment: false,
        aiFailure: false,
        unsupportedRequest: false,
      },
      true,
    );
    expect(section).toBe("");
  });

  it("lists all enabled trigger rules", () => {
    const section = buildVoiceEscalationPromptSection(
      { userRequested: true, negativeSentiment: true, aiFailure: true, unsupportedRequest: true },
      true,
    );
    expect(section).toContain("frustrated");
    expect(section).toContain("capabilities");
  });
});
