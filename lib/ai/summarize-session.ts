import { prisma } from "@/lib/db/prisma";
import { callLLM } from "@/lib/ai/llm";
import { summarizeSessionPrompt } from "@/lib/ai/prompts/summarize-session-v1";

const SUMMARY_MODEL = "openai/gpt-4o-mini";

type SummaryResult = {
  summary: string;
  resolved: boolean;
  qaScore: number;
  sentiment: string;
};

function sentimentToFloat(sentiment: string): number {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return 0.5;
    case "negative":
      return -0.5;
    case "neutral":
    default:
      return 0;
  }
}

const DEFAULT_RESULT: SummaryResult = {
  summary: "Call ended without a complete conversation.",
  resolved: false,
  qaScore: 5,
  sentiment: "Neutral",
};

function buildTranscript(
  messages: Array<{ role: string; content: string }>,
): string {
  const roleLabel: Record<string, string> = {
    USER: "Customer",
    BOT: "AI",
    AGENT: "Agent",
    SYSTEM: "System",
  };

  return messages
    .filter((m) => m.content)
    .map((m) => {
      const label = roleLabel[m.role] ?? m.role;
      return `${label}: ${m.content}`;
    })
    .join("\n");
}

export async function summarizeSession(
  sessionId: string,
): Promise<SummaryResult | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        },
      },
    });

    if (!session) {
      console.warn(`[summarize] Session not found: ${sessionId}`);
      return null;
    }

    if (session.messages.length === 0) {
      const fallback: SummaryResult = {
        summary: "Call ended before any conversation occurred.",
        resolved: false,
        qaScore: 5,
        sentiment: "Neutral",
      };
      await updateDatabase(sessionId, session.orgId, fallback, "");
      return fallback;
    }

    const transcript = buildTranscript(session.messages);

    const llmResult = await callLLM({
      model: SUMMARY_MODEL,
      system: summarizeSessionPrompt(),
      messages: [{ role: "user", content: transcript }],
      maxTokens: 512,
      temperature: 0.1,
    });

    let parsed: SummaryResult;
    try {
      parsed = JSON.parse(llmResult.content) as SummaryResult;
      parsed.summary = parsed.summary ?? DEFAULT_RESULT.summary;
      parsed.resolved =
        typeof parsed.resolved === "boolean"
          ? parsed.resolved
          : DEFAULT_RESULT.resolved;
      parsed.qaScore =
        typeof parsed.qaScore === "number" &&
        parsed.qaScore >= 1 &&
        parsed.qaScore <= 10
          ? parsed.qaScore
          : DEFAULT_RESULT.qaScore;
      parsed.sentiment = ["Positive", "Neutral", "Negative"].includes(
        parsed.sentiment,
      )
        ? parsed.sentiment
        : DEFAULT_RESULT.sentiment;
    } catch {
      console.warn(
        `[summarize] Failed to parse LLM result for ${sessionId}, using defaults`,
      );
      parsed = { ...DEFAULT_RESULT };
    }

    await updateDatabase(sessionId, session.orgId, parsed, transcript);

    return parsed;
  } catch (err) {
    console.error(`[summarize] Error processing session ${sessionId}:`, err);
    return null;
  }
}

async function updateDatabase(
  sessionId: string,
  orgId: string,
  result: SummaryResult,
  transcript: string,
): Promise<void> {
  const current = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true, startedAt: true },
  });

  if (!current) {
    console.warn(`[summarize] Cannot update — session gone: ${sessionId}`);
    return;
  }

  const shouldSetStatus =
    current.status !== "ESCALATED" && current.status !== "CLAIMED";

  const duration = current.startedAt
    ? Math.floor(
        (Date.now() - current.startedAt.getTime()) / 1000,
      )
    : 0;

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      summary: result.summary,
      sentiment: sentimentToFloat(result.sentiment),
      resolvedByAI: result.resolved,
      endedAt: new Date(),
      ...(shouldSetStatus && {
        status: result.resolved ? "RESOLVED" : "ABANDONED",
      }),
    },
  });

  await prisma.callLog.updateMany({
    where: { sessionId },
    data: {
      qaScore: result.qaScore,
      transcript,
      duration,
    },
  });
}
