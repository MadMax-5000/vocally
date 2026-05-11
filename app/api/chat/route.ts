import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { similaritySearch } from "@/lib/knowledge/vector-store";
import { callLLM } from "@/lib/ai/llm";
import { chatBotSystemPromptV1 } from "@/lib/ai/prompts/chat-bot-v1";

const chatRequestSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId, sessionId: existingSessionId, message } = parsed.data;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        org: true,
        channels: {
          where: { channel: "WEB_CHAT" },
        },
        knowledgeDocs: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const webChatChannel = agent.channels[0];
    if (!webChatChannel?.enabled) {
      return NextResponse.json(
        { success: false, error: "Web chat is not enabled for this agent" },
        { status: 403 },
      );
    }

    const orgId = agent.orgId;

    let sessionId = existingSessionId;
    if (sessionId) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session || session.orgId !== orgId) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }
    } else {
      const session = await prisma.session.create({
        data: {
          orgId,
          agentId,
          channel: "CHAT",
          status: "ACTIVE",
          language: "auto",
        },
      });
      sessionId = session.id;
    }

    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "USER",
        content: message,
      },
    });

    const attachedDocIds = agent.knowledgeDocs.map((akd) => akd.knowledgeDocId);

    let knowledgeContext = "";
    try {
      const { embedding } = await generateEmbedding(message);
      const results = await similaritySearch(embedding, orgId, 5, 0.7, attachedDocIds);
      if (results.length > 0) {
        knowledgeContext = results
          .map((r) => `[${r.docTitle}] ${r.content}`)
          .join("\n\n");
      }
    } catch (err) {
      // ignore RAG errors — continue without knowledge context
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

    const temperatureMap: Record<string, number> = {
      STRICT: 0.1,
      BALANCED: 0.7,
      CREATIVE: 1.0,
    };
    const temperature = temperatureMap[agent.creativity] ?? 0.7;

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
    } catch (err) {
      botContent =
        "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }

    const botMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "BOT",
        content: botContent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        userMessage: {
          id: userMessage.id,
          role: "USER",
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        message: {
          id: botMessage.id,
          role: "BOT",
          content: botMessage.content,
          createdAt: botMessage.createdAt.toISOString(),
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
