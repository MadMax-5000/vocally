import { describe, expect, it } from "vitest";

import { productAssistantSystemPrompt } from "@/lib/ai/prompts/product-assistant";

describe("productAssistantSystemPrompt", () => {
  it("identifies as Anselio and includes pricing and contact facts", () => {
    const prompt = productAssistantSystemPrompt({
      language: "the same language the customer is using",
    });

    expect(prompt).toContain("Anselio");
    expect(prompt).not.toContain("Vocally");
    expect(prompt).toContain("999.99 MAD");
    expect(prompt).toContain("3,999.99 MAD");
    expect(prompt).toContain("support@anselio.com");
    expect(prompt).toContain("sales@anselio.com");
    expect(prompt).toContain("Darija");
  });
});
