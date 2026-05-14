import { prisma } from "@/lib/db/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { callLLM } from "@/lib/ai/llm";
import type { LLMMessage } from "@/lib/ai/llm";
import { chatBotSystemPromptV1 } from "@/lib/ai/prompts/chat-bot-v1";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import { evaluateEscalation, applyEscalation } from "@/lib/ai/escalation-service";
import type { EscalationDecision } from "@/lib/ai/escalation-service";
import { getAllToolDefinitions, getToolHandler } from "@/lib/ai/tools/registry";
import type { ToolCall, ToolContext } from "@/lib/ai/tools/types";
import { dtmfRequestStore } from "@/lib/ai/tools/handlers";
import type { DtmfRequest } from "@/lib/ai/tools/handlers";
import type { Channel } from "@prisma/client";

export type ProcessMessageInput = {
  orgId: string;
  agentId: string;
  sessionId: string;
  message: string;
  channel?: Channel;
};

export type ProcessMessageResult = {
  botContent: string;
  sessionId: string;
  escalation?: EscalationDecision;
  dtmfRequest?: DtmfRequest | null;
};

const AI_FALLBACK = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";

const TEMPERATURE_MAP: Record<string, number> = {
  STRICT: 0.1,
  BALANCED: 0.7,
  CREATIVE: 1.0,
};

const MAX_TOOL_ITERATIONS = 5;

async function executeToolCalls(
  toolCalls: ToolCall[],
  ctx: ToolContext,
): Promise<LLMMessage[]> {
  const results: LLMMessage[] = [];

  for (const tc of toolCalls) {
    const handler = getToolHandler(tc.function.name);
    let content: string;

    if (!handler) {
      content = JSON.stringify({ error: `Unknown tool: ${tc.function.name}` });
    } else {
      try {
        const args = JSON.parse(tc.function.arguments);
        content = await handler(args, ctx);
      } catch (err) {
        content = JSON.stringify({
          error: `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    results.push({
      role: "tool",
      tool_call_id: tc.id,
      name: tc.function.name,
      content,
    });
  }

  return results;
}

export async function processMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
  const { orgId, agentId, sessionId, message } = input;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      org: { select: { name: true } },
      knowledgeDocs: { select: { knowledgeDocId: true } },
    },
  });

  if (!agent || agent.orgId !== orgId) {
    throw new Error("Agent not found");
  }

  const attachedDocIds = agent.knowledgeDocs.map((akd) => akd.knowledgeDocId);

  let knowledgeContext = "";
  try {
    const { embedding } = await generateEmbedding(message);
    const results = await similaritySearch(embedding, orgId, 5, 0.7, attachedDocIds);
    if (results.length > 0) {
      knowledgeContext = results.map((r) => `[${r.docTitle}] ${r.content}`).join("\n\n");
    }
  } catch {
    // continue without knowledge context
  }

  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const promptLanguage = "the same language the customer is using";

  const toolDefinitions = getAllToolDefinitions();

  const systemPrompt =
    input.channel === "VOICE"
      ? voiceBotSystemPromptV1({
          agentName: agent.name,
          orgName: agent.org.name,
          instructions: agent.instructions,
          knowledgeContext,
          language: promptLanguage,
          toolDefinitions,
        })
      : chatBotSystemPromptV1({
          agentName: agent.name,
          orgName: agent.org.name,
          instructions: agent.instructions,
          knowledgeContext,
          language: promptLanguage,
          toolDefinitions,
        });

  const llmMessages: LLMMessage[] = history
    .filter((m) => m.role === "USER" || m.role === "BOT")
    .map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  llmMessages.push({ role: "user", content: message });

  const temperature = TEMPERATURE_MAP[agent.creativity] ?? 0.7;

  let botContent: string;
  let llmFailed = false;
  const toolCtx: ToolContext = { orgId, sessionId };

  try {
    const firstResult = await callLLM({
      model: agent.llmModel,
      system: systemPrompt,
      messages: llmMessages,
      maxTokens: 1024,
      temperature,
      tools: toolDefinitions,
      tool_choice: "auto",
    });

    const currentMessages: LLMMessage[] = [
      ...llmMessages,
      {
        role: "assistant",
        content: firstResult.content,
        tool_calls: firstResult.tool_calls,
      },
    ];

    let toolCallCount = 0;
    let activeToolCalls = firstResult.tool_calls;

    while (activeToolCalls && activeToolCalls.length > 0 && toolCallCount < MAX_TOOL_ITERATIONS) {
      toolCallCount++;

      const toolResults = await executeToolCalls(activeToolCalls, toolCtx);
      currentMessages.push(...toolResults);

      const followUp = await callLLM({
        model: agent.llmModel,
        system: systemPrompt,
        messages: currentMessages,
        maxTokens: 1024,
        temperature,
      });

      currentMessages.push({
        role: "assistant",
        content: followUp.content,
        tool_calls: followUp.tool_calls,
      });

      activeToolCalls = followUp.tool_calls;
    }

    botContent = currentMessages[currentMessages.length - 1]?.content ?? "";
  } catch {
    botContent = AI_FALLBACK;
    llmFailed = true;
  }

  const previousBotMessages = history
    .filter((m) => m.role === "BOT")
    .map((m) => ({ content: m.content }));

  const escalation = evaluateEscalation({
    userMessage: message,
    botContent,
    llmFailed,
    previousBotMessages,
    handoffEnabled: agent.handoffEnabled,
  });

  if (escalation.shouldEscalate) {
    await applyEscalation({
      sessionId,
      orgId,
      decision: escalation,
    });
  }

  const dtmfRequest = dtmfRequestStore.get(sessionId) ?? null;
  if (dtmfRequest) dtmfRequestStore.delete(sessionId);

  return {
    botContent,
    sessionId,
    escalation: escalation.shouldEscalate ? escalation : undefined,
    dtmfRequest,
  };
}
