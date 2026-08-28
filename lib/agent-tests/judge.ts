import { callLLM } from "@/lib/ai/llm";
import { agentTestJudgePromptV1 } from "@/lib/ai/prompts/agent-test-judge-v1";
import { logServerWarning } from "@/lib/logger";

import { JUDGE_MODEL } from "./constants";

export type JudgeResult = {
  passed: boolean;
  reason: string;
};

function parseJudgeJson(content: string): JudgeResult | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
      passed?: unknown;
      reason?: unknown;
    };
    if (typeof parsed.passed !== "boolean") return null;
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : parsed.passed
          ? "Response meets the expected quality bar."
          : "Response did not meet the expected quality bar.";
    return { passed: parsed.passed, reason };
  } catch {
    return null;
  }
}

export async function judgeAgentTestReply(input: {
  question: string;
  reply: string;
  instructions: string | null;
  knowledgeContext: string;
}): Promise<JudgeResult> {
  const userContent = [
    `Question:\n${input.question}`,
    `Agent reply:\n${input.reply}`,
    `Instructions:\n${input.instructions?.trim() || "(none)"}`,
    `Knowledge snippets:\n${input.knowledgeContext.trim() || "(none)"}`,
  ].join("\n\n");

  try {
    const llmResult = await callLLM({
      model: JUDGE_MODEL,
      system: agentTestJudgePromptV1(),
      messages: [{ role: "user", content: userContent }],
      maxTokens: 256,
      temperature: 0,
    });
    return (
      parseJudgeJson(llmResult.content) ?? {
        passed: false,
        reason: "Could not parse judge output.",
      }
    );
  } catch (err) {
    logServerWarning("agent_test_judge_failed", {
      errorName: err instanceof Error ? err.name : "unknown",
    });
    return {
      passed: false,
      reason: "Judge unavailable.",
    };
  }
}
