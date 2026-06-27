import { prisma } from "@/lib/db/prisma";
import { logServerWarning } from "@/lib/logger";
import type { ResolvedEscalationAction } from "@/lib/deploy/escalation-action";

export enum EscalationTrigger {
  USER_REQUESTED = "user_requested",
  AI_FAILURE = "ai_failure",
  UNSUPPORTED_REQUEST = "unsupported_request",
  NEGATIVE_SENTIMENT = "negative_sentiment",
}

export type EscalationDecision = {
  shouldEscalate: boolean;
  trigger?: EscalationTrigger;
  reason?: string;
};

const AI_FAILURE_FALLBACK =
  "I'm sorry, I'm having trouble processing your request right now. Please try again later.";

const HUMAN_KEYWORDS = [
  "human",
  "agent",
  "representative",
  "person",
  "speak to someone",
  "talk to a person",
  "real person",
  "customer service",
  "operator",
  "live person",
  "live agent",
  "speak to a human",
  "talk to a human",
  "talk to human",
  "speak to human",
  "transfer to human",
  "transfer me",
  "talk to agent",
  "speak to agent",
  "get me a human",
  "i want a human",
  "connect me to",
  "بشر",
  "موظف",
  "ممثل",
  "وكيل",
  "humain",
  "opérateur",
  "conseiller",
  "personne",
  "un agent",
  "parler à quelqu",
  "واحد بنadem",
  "شخص",
];

const FRUSTRATION_KEYWORDS = [
  "angry",
  "frustrated",
  "upset",
  "annoyed",
  "furious",
  "terrible",
  "horrible",
  "awful",
  "worst",
  "useless",
  "stupid",
  "ridiculous",
  "unacceptable",
  "fed up",
  "sick of",
  "done with",
  "not happy",
  "this is a joke",
  "are you kidding",
  "what the hell",
  "for god",
  "seriously",
  "غاضب",
  "محبط",
  "فظيع",
  "غير مقبول",
  "énervé",
  "frustré",
  "horrible",
  "inacceptable",
];

const UNSUPPORTED_PHRASES = [
  "I cannot",
  "I'm sorry, but I",
  "I am sorry, but I",
  "I'm not able to",
  "I am not able to",
  "outside my capabilities",
  "outside the scope",
  "unable to assist",
  "can't help with",
  "cannot help with this",
  "cannot assist",
  "can't assist",
  "not programmed to",
  "don't have the ability",
  "do not have the ability",
  "not something I can",
  "can't process",
  "cannot process",
  "I'm unable to",
  "I am unable to",
];

export function checkUserRequestedHuman(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return HUMAN_KEYWORDS.some((kw) => lower.includes(kw));
}

export function checkNegativeSentiment(text: string): boolean {
  const lower = text.toLowerCase().trim();

  const hasKeyword = FRUSTRATION_KEYWORDS.some((kw) => lower.includes(kw));

  const hasAllCaps = text.split(/\s+/).filter((w) => w.length > 2).some((w) => w === w.toUpperCase() && /^[A-Z]{3,}$/.test(w));

  const hasRepeatedPunct = /[!?]{2,}/.test(text) || (text.split("!").length - 1) + (text.split("?").length - 1) >= 3;

  return hasKeyword || hasAllCaps || hasRepeatedPunct;
}

export function checkUnsupportedRequest(botContent: string): boolean {
  const lower = botContent.toLowerCase().trim();
  return UNSUPPORTED_PHRASES.some((phrase) => lower.startsWith(phrase) || lower.includes(phrase));
}

export function checkAiFailure(
  botContent: string,
  previousBotMessages: Array<{ content: string }>,
): boolean {
  if (botContent === AI_FAILURE_FALLBACK) return true;

  const recentFailures = previousBotMessages.filter((m) => m.content === AI_FAILURE_FALLBACK);
  return recentFailures.length >= 2;
}

function isTriggerEnabled(
  enabledTriggers: EscalationTrigger[] | undefined,
  trigger: EscalationTrigger,
): boolean {
  if (!enabledTriggers || enabledTriggers.length === 0) return true;
  return enabledTriggers.includes(trigger);
}

export function evaluateEscalation(params: {
  userMessage: string;
  botContent: string;
  llmFailed: boolean;
  previousBotMessages: Array<{ content: string }>;
  handoffEnabled: boolean;
  enabledTriggers?: EscalationTrigger[];
}): EscalationDecision {
  if (!params.handoffEnabled) {
    return { shouldEscalate: false };
  }

  if (
    isTriggerEnabled(params.enabledTriggers, EscalationTrigger.USER_REQUESTED) &&
    checkUserRequestedHuman(params.userMessage)
  ) {
    return {
      shouldEscalate: true,
      trigger: EscalationTrigger.USER_REQUESTED,
      reason: "Customer explicitly requested to speak to a human agent",
    };
  }

  if (
    isTriggerEnabled(params.enabledTriggers, EscalationTrigger.AI_FAILURE) &&
    (params.llmFailed || checkAiFailure(params.botContent, params.previousBotMessages))
  ) {
    return {
      shouldEscalate: true,
      trigger: EscalationTrigger.AI_FAILURE,
      reason: params.llmFailed
        ? "AI encountered an error processing the request"
        : "AI failed to provide a valid response multiple times",
    };
  }

  if (
    isTriggerEnabled(params.enabledTriggers, EscalationTrigger.UNSUPPORTED_REQUEST) &&
    checkUnsupportedRequest(params.botContent)
  ) {
    return {
      shouldEscalate: true,
      trigger: EscalationTrigger.UNSUPPORTED_REQUEST,
      reason: "Customer request is outside the AI's capabilities",
    };
  }

  if (
    isTriggerEnabled(params.enabledTriggers, EscalationTrigger.NEGATIVE_SENTIMENT) &&
    checkNegativeSentiment(params.userMessage)
  ) {
    return {
      shouldEscalate: true,
      trigger: EscalationTrigger.NEGATIVE_SENTIMENT,
      reason: "Customer is showing signs of frustration or negative sentiment",
    };
  }

  return { shouldEscalate: false };
}

export async function applyEscalation(params: {
  sessionId: string;
  orgId: string;
  decision: EscalationDecision;
}): Promise<void> {
  if (!params.decision.shouldEscalate) return;

  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    select: { status: true },
  });

  const escalatableStatuses = new Set(["ACTIVE", "BOT", "WAITING"]);
  if (!session || !escalatableStatuses.has(session.status)) return;

  await prisma.session.update({
    where: { id: params.sessionId },
    data: {
      status: "ESCALATED",
      escalatedAt: new Date(),
      escalatedReason: params.decision.trigger,
    },
  });

  await prisma.message.create({
    data: {
      sessionId: params.sessionId,
      role: "SYSTEM",
      content: `Conversation escalated: ${params.decision.reason}`,
    },
  });
}

export function buildTriggerLabels(): Record<string, string> {
  return {
    [EscalationTrigger.USER_REQUESTED]: "User requested human",
    [EscalationTrigger.AI_FAILURE]: "AI failure",
    [EscalationTrigger.UNSUPPORTED_REQUEST]: "Unsupported request",
    [EscalationTrigger.NEGATIVE_SENTIMENT]: "Negative sentiment",
  };
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function extractEmailFromText(...texts: string[]): string | null {
  for (const text of texts) {
    const match = text.match(EMAIL_PATTERN);
    if (match) return match[0];
  }
  return null;
}

export async function createEscalationTicket(params: {
  orgId: string;
  sessionId: string;
  userMessage: string;
  decision: EscalationDecision;
  config: Pick<
    ResolvedEscalationAction,
    "ticketPriority" | "requireEmailForTicket"
  >;
}): Promise<string | null> {
  if (!params.decision.shouldEscalate) return null;

  const existing = await prisma.ticket.findFirst({
    where: { sessionId: params.sessionId, orgId: params.orgId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const history = await prisma.message.findMany({
    where: { sessionId: params.sessionId, role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true },
  });

  const customerEmail = extractEmailFromText(
    params.userMessage,
    ...history.map((m) => m.content),
  );

  if (params.config.requireEmailForTicket && !customerEmail) {
    logServerWarning("escalation_ticket_skipped_no_email", {
      sessionId: params.sessionId,
    });
    return null;
  }

  const subject =
    params.decision.reason?.slice(0, 120) ?? "Escalated conversation";
  const description = [
    params.decision.reason ?? "Escalated to human agent",
    "",
    `Last customer message: ${params.userMessage.slice(0, 500)}`,
  ].join("\n");

  const ticket = await prisma.ticket.create({
    data: {
      orgId: params.orgId,
      sessionId: params.sessionId,
      subject,
      description,
      priority: params.config.ticketPriority,
      customerEmail,
    },
  });

  return ticket.id;
}
