import { describe, expect, it, vi, beforeEach } from "vitest";

import { generateDynamicSuggestedMessages } from "@/lib/ai/generate-suggested-messages";
import { callLLM } from "@/lib/ai/llm";

vi.mock("@/lib/ai/llm", () => ({
  callLLM: vi.fn(),
}));

describe("generateDynamicSuggestedMessages", () => {
  beforeEach(() => {
    vi.mocked(callLLM).mockReset();
  });

  it("parses JSON suggestions from the model", async () => {
    vi.mocked(callLLM).mockResolvedValue({
      content: '{"suggestions":["Book a demo","Pricing"]}',
      finishReason: "stop",
      usage: null,
    });

    const result = await generateDynamicSuggestedMessages({
      llmModel: "z-ai/glm-5.3-flash",
      recentMessages: [
        { role: "USER", content: "Hi" },
        { role: "BOT", content: "Hello! How can I help?" },
      ],
      botContent: "Hello! How can I help?",
    });

    expect(result).toEqual(["Book a demo", "Pricing"]);
  });

  it("clamps chip length and count", async () => {
    const long = "x".repeat(80);
    vi.mocked(callLLM).mockResolvedValue({
      content: JSON.stringify({
        suggestions: [long, "One", "Two", "Three"],
      }),
      finishReason: "stop",
      usage: null,
    });

    const result = await generateDynamicSuggestedMessages({
      llmModel: "z-ai/glm-5.3-flash",
      recentMessages: [],
      botContent: "Thanks for reaching out.",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
    for (const chip of result) {
      expect(chip.length).toBeLessThanOrEqual(40);
    }
  });

  it("returns empty array when the model response is invalid", async () => {
    vi.mocked(callLLM).mockResolvedValue({
      content: "not json",
      finishReason: "stop",
      usage: null,
    });

    const result = await generateDynamicSuggestedMessages({
      llmModel: "z-ai/glm-5.3-flash",
      recentMessages: [],
      botContent: "Hello",
    });

    expect(result).toEqual([]);
  });
});
