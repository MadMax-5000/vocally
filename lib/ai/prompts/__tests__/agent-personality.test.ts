import { describe, expect, it } from "vitest";

import { buildAgentPersonalityPromptSection } from "@/lib/ai/prompts/agent-personality";

describe("buildAgentPersonalityPromptSection", () => {
  it("returns empty when all fields are blank", () => {
    expect(buildAgentPersonalityPromptSection({})).toBe("");
    expect(
      buildAgentPersonalityPromptSection({
        agentType: null,
        customRole: "  ",
        tone: null,
        customTone: "",
        description: null,
        websiteUrl: "   ",
      }),
    ).toBe("");
  });

  it("includes industry context for a non-custom type", () => {
    const section = buildAgentPersonalityPromptSection({
      agentType: "RETAIL_ECOMMERCE",
    });
    expect(section).toContain("## Personality");
    expect(section).toContain("retail and ecommerce");
  });

  it("uses custom role instead of a generic custom type label", () => {
    const section = buildAgentPersonalityPromptSection({
      agentType: "CUSTOM",
      customRole: "Hotel concierge",
    });
    expect(section).toContain("Your role: Hotel concierge.");
    expect(section).not.toContain("custom context");
  });

  it("skips custom type when no role is set", () => {
    expect(
      buildAgentPersonalityPromptSection({ agentType: "CUSTOM" }),
    ).toBe("");
  });

  it("includes tone, optional notes, goal, and website", () => {
    const section = buildAgentPersonalityPromptSection({
      tone: "FAST_CONCISE",
      customTone: "warm Darija, short sentences",
      description: "Book restaurant tables",
      websiteUrl: "https://example.com",
    });
    expect(section).toContain("fast and concise");
    expect(section).toContain("warm Darija, short sentences");
    expect(section).toContain("Your main goal: Book restaurant tables");
    expect(section).toContain("https://example.com");
    expect(section).toContain("do not invent other URLs");
  });
});
