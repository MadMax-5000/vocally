import { describe, expect, it } from "vitest";

import { buildGuardrailPromptSection } from "@/lib/agent-security/guardrails";
import { prependRecordingConsent } from "@/lib/agent-security/consent";

describe("buildGuardrailPromptSection", () => {
  it("returns empty when all toggles are off", () => {
    expect(
      buildGuardrailPromptSection({
        stayOnTopic: false,
        refuseSensitive: false,
        escalateWhenUnsure: false,
      }),
    ).toBe("");
  });

  it("includes enabled rules without duplicating the system prompt", () => {
    const section = buildGuardrailPromptSection({
      stayOnTopic: true,
      refuseSensitive: true,
      escalateWhenUnsure: true,
    });
    expect(section).toContain("on-topic");
    expect(section).toContain("medical");
    expect(section).toContain("not confident");
  });
});

describe("prependRecordingConsent", () => {
  it("prepends a French disclaimer once", () => {
    const first = prependRecordingConsent("Bonjour", true, "fr");
    expect(first).toBe("Cet appel peut être enregistré. Bonjour");
    expect(prependRecordingConsent(first, true, "fr")).toBe(first);
  });

  it("leaves the greeting unchanged when disabled", () => {
    expect(prependRecordingConsent("Hello", false, "en")).toBe("Hello");
  });
});
