import { prisma } from "@/lib/db/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { logServerWarning } from "@/lib/logger";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { callLLM } from "@/lib/ai/llm";
import type { LLMMessage } from "@/lib/ai/llm";
import { resolveLlmModelId } from "@/lib/ai/model-registry";
import { chatBotSystemPromptV1 } from "@/lib/ai/prompts/chat-bot-v1";
import { voiceBotSystemPromptV1 } from "@/lib/ai/prompts/voice-bot-v1";
import {
  evaluateEscalation,
  applyEscalation,
  createEscalationTicket,
} from "@/lib/ai/escalation-service";
import type { EscalationDecision } from "@/lib/ai/escalation-service";
import {
  resolveEscalationAction,
  resolveCustomerEscalationMessage,
  resolveEscalationTriggers,
} from "@/lib/deploy/escalation-action";
import { getWebChatChannel, parseWebChatConfig } from "@/lib/deploy/web-chat-config";
import { resolveBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { resolveCollectLeadsAction } from "@/lib/deploy/collect-leads-action";
import {
  isCustomFormConfigured,
  resolveCustomFormAction,
} from "@/lib/deploy/custom-form-action";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { customFormRequestStore } from "@/lib/ai/tools/handlers/show-custom-form";
import { getToolDefinitionsForAgent, getToolHandler } from "@/lib/ai/tools/registry";
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
  customerFacingMessage?: string;
  ticketId?: string;
  dtmfRequest?: DtmfRequest | null;
  formRequest?: ChatFormUi | null;
};

const AI_FALLBACK = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";

const TEMPERATURE_MAP: Record<string, number> = {
  STRICT: 0.1,
  BALANCED: 0.7,
  CREATIVE: 1.0,
};

const MAX_TOOL_ITERATIONS = 5;

/** Strong match: high precision snippets for RAG injection. */
const RAG_PRIMARY_TOP_K = 5;
const RAG_PRIMARY_MIN_SCORE = 0.7;
/** When nothing passes the primary bar but the agent has attached docs, retrieve broader matches for paraphrased queries. */
const RAG_FALLBACK_TOP_K = 8;
const RAG_FALLBACK_MIN_SCORE = 0.5;

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
      channels: { select: { channel: true, enabled: true, config: true } },
    },
  });

  if (!agent || agent.orgId !== orgId) {
    throw new Error("Agent not found");
  }

  const attachedDocIds = agent.knowledgeDocs.map((akd) => akd.knowledgeDocId);

  let knowledgeContext = "";
  try {
    const { embedding } = await generateEmbedding(message);
    let results = await similaritySearch(
      embedding,
      orgId,
      RAG_PRIMARY_TOP_K,
      RAG_PRIMARY_MIN_SCORE,
      attachedDocIds,
    );

    if (results.length === 0 && attachedDocIds.length > 0) {
      results = await similaritySearch(
        embedding,
        orgId,
        RAG_FALLBACK_TOP_K,
        RAG_FALLBACK_MIN_SCORE,
        attachedDocIds,
      );
    }

    if (results.length > 0) {
      knowledgeContext = results.map((r) => `[${r.docTitle}] ${r.content}`).join("\n\n");
    } else if (attachedDocIds.length > 0) {
      logServerWarning("rag_retrieval_empty_after_fallback", {
        attachedDocCount: attachedDocIds.length,
        primaryMinScore: RAG_PRIMARY_MIN_SCORE,
        fallbackMinScore: RAG_FALLBACK_MIN_SCORE,
        messageCharLength: message.length,
      });
    }
  } catch (err) {
    logServerWarning("rag_retrieval_failed", {
      attachedDocCount: attachedDocIds.length,
      messageCharLength: message.length,
      errorName: err instanceof Error ? err.name : "unknown",
    });
  }

  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const promptLanguage = "the same language the customer is using";

  const escalationConfig = resolveEscalationAction(agent.channels);
  const webChatRow = getWebChatChannel(agent.channels);
  const webChatParsed = webChatRow ? parseWebChatConfig(webChatRow.config) : {};
  const hasEscalationConfig = webChatParsed.actions?.escalations !== undefined;
  const collectLeadsAction = resolveCollectLeadsAction(agent.channels);
  const bookAppointmentAction = resolveBookAppointmentAction(agent.channels);
  const customFormAction = resolveCustomFormAction(agent.channels);
  const customFormActive =
    customFormAction.enabled && isCustomFormConfigured(customFormAction);
  const handoffActive =
    agent.handoffEnabled &&
    (escalationConfig.enabled || (!hasEscalationConfig && agent.handoffEnabled));
  const enabledTriggers = resolveEscalationTriggers(escalationConfig.triggers);

  const sessionRow = await prisma.session.findFirst({
    where: { id: sessionId, orgId },
    select: { channel: true },
  });
  const messageChannel = input.channel ?? sessionRow?.channel ?? "CHAT";

  const toolDefinitions = getToolDefinitionsForAgent({
    allowCreateTicket: escalationConfig.allowCreateTicketTool,
    includeCollectLeads: collectLeadsAction.enabled,
    includeCustomForm:
      customFormActive && customFormAction.allowLlmTrigger,
    includeBookAppointment: bookAppointmentAction.enabled,
    bookAppointmentDepartments: bookAppointmentAction.departments,
  });

  let escalationPromptExtra = "";
  if (
    escalationConfig.createTicketOnEscalate &&
    escalationConfig.requireEmailForTicket
  ) {
    escalationPromptExtra =
      "If you escalate or cannot resolve an issue, use create_ticket when you have subject, description, priority, and the customer's email.";
  }

  const instructionsWithEscalation = [agent.instructions, escalationPromptExtra]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt =
    input.channel === "VOICE"
      ? voiceBotSystemPromptV1({
          agentName: agent.name,
          orgName: agent.org.name,
          instructions: instructionsWithEscalation,
          knowledgeContext,
          language: promptLanguage,
          toolDefinitions,
          collectLeads: collectLeadsAction.enabled ? collectLeadsAction : undefined,
          bookAppointment: bookAppointmentAction.enabled
            ? bookAppointmentAction
            : undefined,
        })
      : chatBotSystemPromptV1({
          agentName: agent.name,
          orgName: agent.org.name,
          instructions: instructionsWithEscalation,
          knowledgeContext,
          language: promptLanguage,
          toolDefinitions,
          collectLeads: collectLeadsAction.enabled ? collectLeadsAction : undefined,
          customForm: customFormActive ? customFormAction : undefined,
          bookAppointment: bookAppointmentAction.enabled
            ? bookAppointmentAction
            : undefined,
        });

  const llmMessages: LLMMessage[] = history
    .filter((m) => m.role === "USER" || m.role === "BOT")
    .map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  const lastMessage = llmMessages[llmMessages.length - 1];
  const userMessageAlreadyInHistory =
    lastMessage?.role === "user" && lastMessage.content === message;
  if (!userMessageAlreadyInHistory) {
    llmMessages.push({ role: "user", content: message });
  }

  const llmModel = resolveLlmModelId(agent.llmModel);
  const temperature = TEMPERATURE_MAP[agent.creativity] ?? 0.7;

  let botContent: string;
  let llmFailed = false;
  const toolCtx: ToolContext = {
    orgId,
    sessionId,
    agentId,
    channel: messageChannel,
    collectLeads: collectLeadsAction.enabled ? collectLeadsAction : undefined,
    customForm: customFormActive ? customFormAction : undefined,
    bookAppointment: bookAppointmentAction.enabled
      ? bookAppointmentAction
      : undefined,
  };

  try {
    const firstResult = await callLLM({
      model: llmModel,
      system: systemPrompt,
      messages: llmMessages,
      maxTokens: 1024,
      temperature,
      tools: toolDefinitions,
      tool_choice: "auto",
    });

    logServerWarning("debug_llm_first_result", {
      hasToolCalls: firstResult.tool_calls !== undefined && firstResult.tool_calls.length > 0,
      toolCallCount: firstResult.tool_calls?.length ?? 0,
      toolNames: firstResult.tool_calls?.map((t) => t.function.name).join(",") ?? "",
      finishReason: firstResult.finishReason ?? "none",
      contentPreview: (firstResult.content ?? "").slice(0, 120),
      model: llmModel,
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

      logServerWarning("debug_llm_tool_execution", {
        iteration: toolCallCount,
        toolCount: activeToolCalls.length,
        toolNames: activeToolCalls.map((t) => t.function.name).join(","),
      });

      const toolResults = await executeToolCalls(activeToolCalls, toolCtx);
      currentMessages.push(...toolResults);

      const followUp = await callLLM({
        model: llmModel,
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

  logServerWarning("debug_llm_bot_content", {
    llmFailed,
    charLength: botContent.length,
    contentPreview: botContent.slice(0, 200),
  });

  const previousBotMessages = history
    .filter((m) => m.role === "BOT")
    .map((m) => ({ content: m.content }));

  const escalation = evaluateEscalation({
    userMessage: message,
    botContent,
    llmFailed,
    previousBotMessages,
    handoffEnabled: handoffActive,
    enabledTriggers,
  });

  logServerWarning("debug_llm_escalation", {
    shouldEscalate: escalation.shouldEscalate,
    trigger: escalation.trigger ?? "none",
    reason: escalation.reason ?? "none",
  });

  let ticketId: string | undefined;
  let customerFacingMessage: string | undefined;

  if (escalation.shouldEscalate) {
    await applyEscalation({
      sessionId,
      orgId,
      decision: escalation,
    });

    customerFacingMessage = resolveCustomerEscalationMessage(escalationConfig);

    if (escalationConfig.createTicketOnEscalate) {
      const createdId = await createEscalationTicket({
        orgId,
        sessionId,
        userMessage: message,
        decision: escalation,
        config: escalationConfig,
      });
      if (createdId) ticketId = createdId;
    }
  }

  const dtmfRequest = dtmfRequestStore.get(sessionId) ?? null;
  if (dtmfRequest) dtmfRequestStore.delete(sessionId);

  const formRequest = customFormRequestStore.get(sessionId) ?? null;
  if (formRequest) customFormRequestStore.delete(sessionId);

  return {
    botContent,
    sessionId,
    escalation: escalation.shouldEscalate ? escalation : undefined,
    customerFacingMessage,
    ticketId,
    dtmfRequest,
    formRequest,
  };
}
