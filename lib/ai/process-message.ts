import { prisma } from "@/lib/db/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { callLLM } from "@/lib/ai/llm";
import { chatBotSystemPromptV1 } from "@/lib/ai/prompts/chat-bot-v1";

export type ProcessMessageInput = {
  orgId: string;
  agentId: string;
  sessionId: string;
  message: string;
};

export type ProcessMessageResult = {
  botContent: string;
  sessionId: string;
};

const TEMPERATURE_MAP: Record<string, number> = {
  STRICT: 0.1,
  BALANCED: 0.7,
  CREATIVE: 1.0,
};

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

  const systemPrompt = chatBotSystemPromptV1({
    agentName: agent.name,
    orgName: agent.org.name,
    instructions: agent.instructions,
    knowledgeContext,
    language: "the same language the customer is using",
  });

  const llmMessages = history
    .filter((m) => m.role === "USER" || m.role === "BOT")
    .map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

  const temperature = TEMPERATURE_MAP[agent.creativity] ?? 0.7;

  let botContent: string;
  try {
    const result = await callLLM({
      model: agent.llmModel,
      system: systemPrompt,
      messages: llmMessages,
      maxTokens: 1024,
      temperature,
    });
    botContent = result.content;
  } catch {
    botContent = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }

  return { botContent, sessionId };
}
