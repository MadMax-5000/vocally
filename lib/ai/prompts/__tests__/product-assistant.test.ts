import { describe, expect, it } from "vitest";

import { productAssistantSystemPrompt } from "@/lib/ai/prompts/product-assistant";

describe("productAssistantSystemPrompt", () => {
  it("identifies as Anselio and includes pricing and contact facts", () => {
    const prompt = productAssistantSystemPrompt({
      language: "the same language the customer is using",
    });

    expect(prompt).toContain("Anselio");
    expect(prompt).not.toContain("Vocally");
    expect(prompt).toContain("1,000 MAD HT");
    expect(prompt).toContain("3,000 MAD HT");
    expect(prompt).toContain("Téléphonie Maroc");
    expect(prompt).toContain("1,500 MAD HT");
    expect(prompt).not.toContain("790 MAD HT");
    expect(prompt).not.toContain("4,900 MAD HT");
    expect(prompt).not.toContain("999.99 MAD");
    expect(prompt).not.toContain("3,999.99 MAD");
    expect(prompt).toContain("support@anselio.com");
    expect(prompt).toContain("sales@anselio.com");
    expect(prompt).toContain("Darija");
  });
});
