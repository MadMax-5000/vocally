import { generateEmbedding } from "@/lib/ai/embeddings";
import { handleAgentChatMessage } from "@/lib/api/agent-chat-handler";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { logServerWarning } from "@/lib/logger";
import { prisma } from "@/lib/db/prisma";

import { buildTestChatContext, resolveTestingAsLabel } from "./context";
import { judgeAgentTestReply } from "./judge";

export type RunAgentTestQuestionResult = {
  response: string;
  passed: boolean;
  judgeReason: string;
  testedAs: string;
  status: "PASSED" | "FAILED" | "ERROR";
};

async function loadKnowledgeContext(
  orgId: string,
  agentId: string,
  question: string,
): Promise<string> {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, orgId },
      select: { knowledgeDocs: { select: { knowledgeDocId: true } } },
    });
    const attachedDocIds = agent?.knowledgeDocs.map((row) => row.knowledgeDocId) ?? [];
    const { embedding } = await generateEmbedding(question);
    const results = await similaritySearch(
      embedding,
      orgId,
      5,
      attachedDocIds.length > 0 ? 0.5 : 0.7,
      attachedDocIds.length > 0 ? attachedDocIds : undefined,
    );
    if (results.length === 0) return "";
    return results.map((row) => `[${row.docTitle}] ${row.content}`).join("\n\n");
  } catch (err) {
    logServerWarning("agent_test_knowledge_failed", {
      errorName: err instanceof Error ? err.name : "unknown",
    });
    return "";
  }
}

export async function runAgentTestQuestion(input: {
  orgId: string;
  agentId: string;
  prompt: string;
  previewUserFallback: string;
}): Promise<RunAgentTestQuestionResult> {
  const agent = await prisma.agent.findFirst({
    where: { id: input.agentId, orgId: input.orgId },
    select: {
      id: true,
      instructions: true,
      variables: { select: { key: true, value: true } },
    },
  });

  if (!agent) {
    return {
      response: "",
      passed: false,
      judgeReason: "Agent not found.",
      testedAs: input.previewUserFallback,
      status: "ERROR",
    };
  }

  const testedAs = resolveTestingAsLabel(agent.variables, input.previewUserFallback);
  const context = buildTestChatContext(agent.variables, testedAs);

  const chat = await handleAgentChatMessage({
    orgId: input.orgId,
    agentId: input.agentId,
    sessionId: null,
    message: input.prompt,
    deployment: "widget",
    context,
  });

  if (!chat.ok) {
    return {
      response: "",
      passed: false,
      judgeReason: chat.error.message,
      testedAs,
      status: "ERROR",
    };
  }

  const response = chat.data.message.content;
  const knowledgeContext = await loadKnowledgeContext(
    input.orgId,
    input.agentId,
    input.prompt,
  );
  const verdict = await judgeAgentTestReply({
    question: input.prompt,
    reply: response,
    instructions: agent.instructions,
    knowledgeContext,
  });

  return {
    response,
    passed: verdict.passed,
    judgeReason: verdict.reason,
    testedAs,
    status: verdict.passed ? "PASSED" : "FAILED",
  };
}
