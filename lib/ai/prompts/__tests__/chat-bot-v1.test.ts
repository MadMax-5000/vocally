import { describe, expect, it } from "vitest";

import { chatBotSystemPromptV1 } from "@/lib/ai/prompts/chat-bot-v1";
import { REQUEST_SECURE_INPUT } from "@/lib/ai/tools/definitions";
import { getAllToolDefinitions } from "@/lib/ai/tools/registry";

const baseInput = {
  agentName: "Atlas",
  orgName: "Centre Médical Atlas",
  knowledgeContext: "",
  language: "French",
};

describe("chatBotSystemPromptV1", () => {
  it("does not tell the model to press # when using default tools", () => {
    const prompt = chatBotSystemPromptV1(baseInput);
    expect(prompt).not.toContain("press #");
    expect(getAllToolDefinitions().map((t) => t.function.name)).not.toContain(
      "request_secure_input",
    );
  });

  it("includes press # only when request_secure_input is passed in", () => {
    const prompt = chatBotSystemPromptV1({
      ...baseInput,
      toolDefinitions: [REQUEST_SECURE_INPUT],
    });
    expect(prompt).toContain("press #");
  });
});
