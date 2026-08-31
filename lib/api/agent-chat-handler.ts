import type { Agent, AgentChannel, SessionStatus } from "@prisma/client";

import { processMessage } from "@/lib/ai/process-message";
import type { ProcessMessageResult } from "@/lib/ai/process-message";
import { generateDynamicSuggestedMessages } from "@/lib/ai/generate-suggested-messages";
import { isApiDeploymentEnabled } from "@/lib/deploy/api-config";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { encodeChatSse } from "@/lib/chat/sse";
import type { ChatStreamEscalation, ChatStreamEvent } from "@/lib/chat/stream-events";
import {
  buildFormUiPayload,
  isCustomFormConfigured,
  resolveCustomFormAction,
} from "@/lib/deploy/custom-form-action";
import {
  mergeSuggestedMessagesForResponse,
  resolveSuggestedMessagesAction,
} from "@/lib/deploy/suggested-messages-action";
import { prisma } from "@/lib/db/prisma";
import { maybeRedactPii } from "@/lib/agent-security/pii";

export type AgentForApiAccess = Pick<
  Agent,
  "id" | "orgId" | "apiToken" | "visibility" | "status"
>;

export type ApiAccessError = {
  status: 401 | 403 | 404;
  message: string;
};

export function verifyAgentApiAccess(
  agent: AgentForApiAccess,
  token: string | null | undefined,
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  ownerOrgId: string | null | undefined,
): ApiAccessError | null {
  const isOwnerPreview = !!ownerOrgId && agent.orgId === ownerOrgId;

  if (isOwnerPreview) {
    return null;
  }

  if (!token || !agent.apiToken || agent.apiToken !== token) {
    return { status: 401, message: "Invalid API token" };
  }

  if (agent.visibility !== "PUBLIC" || agent.status !== "ACTIVE") {
    return { status: 403, message: "Agent not available" };
  }

  if (!isApiDeploymentEnabled(channels)) {
    return { status: 403, message: "API deployment is not enabled for this agent" };
  }

  return null;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

type ChatDeployment = "widget" | "help";

type HandleAgentChatMessageInput = {
  orgId: string;
  agentId: string;
  sessionId: string | null | undefined;
  message: string;
  deployment?: ChatDeployment;
  context?: string;
};

type HandleAgentChatMessageSuccess = {
  ok: true;
  data: {
    sessionId: string;
    userMessage: {
      id: string;
      role: "USER";
      content: string;
      createdAt: string;
    };
    message: {
      id: string;
      role: "BOT";
      content: string;
      createdAt: string;
      ui?: ChatFormUi;
    };
    ui?: ChatFormUi;
    suggestedMessages?: string[];
    sessionStatus?: SessionStatus;
    escalation?: {
      escalated: true;
      trigger: string;
      message: string;
      sessionStatus: "ESCALATED";
      ticketId?: string;
    };
  };
};

type HandleAgentChatMessageFailure = {
  ok: false;
  error: { status: 404; message: string };
};

export type HandleAgentChatMessageResult =
  | HandleAgentChatMessageSuccess
  | HandleAgentChatMessageFailure;

type ChatReplySideEffects = {
  formUi?: ChatFormUi;
  suggestedMessages?: string[];
  sessionStatus?: SessionStatus;
  escalationPayload?: ChatStreamEscalation;
};

async function loadWebChatAgent(agentId: string, orgId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, orgId },
    include: {
      channels: { where: { channel: "WEB_CHAT" } },
    },
  });
}

function buildEscalationPayload(
  processResult: ProcessMessageResult,
  replyContent: string,
): ChatStreamEscalation | undefined {
  const { escalation, customerFacingMessage, ticketId } = processResult;
  if (!escalation?.shouldEscalate || !escalation.trigger) return undefined;
  return {
    escalated: true,
    trigger: escalation.trigger,
    message: customerFacingMessage ?? replyContent,
    sessionStatus: "ESCALATED",
    ...(ticketId ? { ticketId } : {}),
  };
}

async function resolveFormUi(params: {
  agent: Awaited<ReturnType<typeof loadWebChatAgent>>;
  sessionId: string;
  agentId: string;
  userMessageCount: number;
  formUi: ChatFormUi | undefined;
  shouldEscalate: boolean;
}): Promise<ChatFormUi | undefined> {
  const { agent, sessionId, agentId, userMessageCount, shouldEscalate } = params;
  let formUi = params.formUi;
  if (formUi || shouldEscalate || !agent) return formUi;

  const customForm = resolveCustomFormAction(agent.channels);
  const threshold = customForm.showAfterUserMessages;
  if (
    !customForm.enabled ||
    !isCustomFormConfigured(customForm) ||
    threshold === null ||
    userMessageCount !== threshold
  ) {
    return formUi;
  }

  const existingSubmission = await prisma.formSubmission.findUnique({
    where: {
      agentId_sessionId_formId: {
        agentId,
        sessionId,
        formId: customForm.formId,
      },
    },
    select: { id: true },
  });
  if (!existingSubmission) {
    formUi = buildFormUiPayload(customForm) ?? undefined;
  }
  return formUi;
}

async function resolveSuggestedMessages(params: {
  agent: Awaited<ReturnType<typeof loadWebChatAgent>>;
  sessionId: string;
  userMessageCount: number;
  replyContent: string;
  shouldEscalate: boolean;
}): Promise<string[] | undefined> {
  const { agent, sessionId, userMessageCount, replyContent, shouldEscalate } =
    params;
  if (shouldEscalate) return [];
  if (!agent) return undefined;

  const action = resolveSuggestedMessagesAction(agent.channels);
  if (!action.enabled) return undefined;

  let dynamicSuggestions: string[] = [];
  if (action.dynamicEnabled) {
    const recentMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { role: true, content: true },
    });

    dynamicSuggestions = await generateDynamicSuggestedMessages({
      llmModel: agent.llmModel,
      recentMessages: recentMessages.filter(
        (m) => m.role === "USER" || m.role === "BOT",
      ),
      botContent: replyContent,
    });
  }

  return mergeSuggestedMessagesForResponse({
    action,
    userMessageCount,
    dynamicSuggestions,
  });
}

async function resolveChatReplySideEffects(params: {
  orgId: string;
  agentId: string;
  sessionId: string;
  processResult: ProcessMessageResult;
  replyContent: string;
  includeSuggestions: boolean;
}): Promise<ChatReplySideEffects> {
  const {
    orgId,
    agentId,
    sessionId,
    processResult,
    replyContent,
    includeSuggestions,
  } = params;
  const { escalation, formRequest } = processResult;
  const shouldEscalate = Boolean(escalation?.shouldEscalate);
  const agent = await loadWebChatAgent(agentId, orgId);

  const userMessageCount = await prisma.message.count({
    where: { sessionId, role: "USER" },
  });

  const formUi = await resolveFormUi({
    agent,
    sessionId,
    agentId,
    userMessageCount,
    formUi: formRequest ?? undefined,
    shouldEscalate,
  });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  const suggestedMessages = includeSuggestions
    ? await resolveSuggestedMessages({
        agent,
        sessionId,
        userMessageCount,
        replyContent,
        shouldEscalate,
      })
    : undefined;

  return {
    formUi,
    suggestedMessages,
    sessionStatus: session?.status,
    escalationPayload: buildEscalationPayload(processResult, replyContent),
  };
}

async function ensureChatSession(params: {
  orgId: string;
  agentId: string;
  existingSessionId: string | null | undefined;
}): Promise<{ ok: true; sessionId: string } | HandleAgentChatMessageFailure> {
  const { orgId, agentId, existingSessionId } = params;
  if (existingSessionId) {
    const session = await prisma.session.findUnique({
      where: { id: existingSessionId },
    });
    if (!session || session.orgId !== orgId) {
      return {
        ok: false,
        error: { status: 404, message: "Session not found" },
      };
    }
    return { ok: true, sessionId: existingSessionId };
  }

  const session = await prisma.session.create({
    data: {
      orgId,
      agentId,
      channel: "CHAT",
      status: "ACTIVE",
      language: "auto",
    },
  });
  return { ok: true, sessionId: session.id };
}

export async function handleAgentChatMessage({
  orgId,
  agentId,
  sessionId: existingSessionId,
  message,
  context,
}: HandleAgentChatMessageInput): Promise<HandleAgentChatMessageResult> {
  const sessionResult = await ensureChatSession({
    orgId,
    agentId,
    existingSessionId,
  });
  if (!sessionResult.ok) return sessionResult;
  const sessionId = sessionResult.sessionId;

  const security = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { piiRedactionEnabled: true },
  });
  const redact = security?.piiRedactionEnabled === true;
  const storedUserContent = maybeRedactPii(message, redact);

  const userMessage = await prisma.message.create({
    data: { sessionId, role: "USER", content: storedUserContent },
  });

  const effectiveMessage = context ? `[Context: ${context}]\n${message}` : message;

  const processResult = await processMessage({
    orgId,
    agentId,
    sessionId,
    message: effectiveMessage,
  });

  const { botContent, escalation, customerFacingMessage } = processResult;
  const replyContent =
    escalation?.shouldEscalate && customerFacingMessage
      ? customerFacingMessage
      : botContent;

  const botMessage = await prisma.message.create({
    data: {
      sessionId,
      role: "BOT",
      content: maybeRedactPii(replyContent, redact),
    },
  });

  const side = await resolveChatReplySideEffects({
    orgId,
    agentId,
    sessionId,
    processResult,
    replyContent,
    includeSuggestions: true,
  });

  const { formUi, suggestedMessages, sessionStatus, escalationPayload } = side;

  return {
    ok: true,
    data: {
      sessionId,
      userMessage: {
        id: userMessage.id,
        role: "USER",
        content: message,
        createdAt: userMessage.createdAt.toISOString(),
      },
      message: {
        id: botMessage.id,
        role: "BOT",
        content: replyContent,
        createdAt: botMessage.createdAt.toISOString(),
        ...(formUi ? { ui: formUi } : {}),
      },
      ...(formUi ? { ui: formUi } : {}),
      ...(sessionStatus ? { sessionStatus } : {}),
      ...(escalationPayload ? { escalation: escalationPayload } : {}),
      ...(suggestedMessages !== undefined ? { suggestedMessages } : {}),
    },
  };
}

export type CreateAgentChatSseResult =
  | HandleAgentChatMessageFailure
  | { ok: true; stream: ReadableStream<Uint8Array> };

export async function createAgentChatSseStream({
  orgId,
  agentId,
  sessionId: existingSessionId,
  message,
  context,
}: HandleAgentChatMessageInput): Promise<CreateAgentChatSseResult> {
  const sessionResult = await ensureChatSession({
    orgId,
    agentId,
    existingSessionId,
  });
  if (!sessionResult.ok) return sessionResult;
  const sessionId = sessionResult.sessionId;

  const security = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    select: { piiRedactionEnabled: true },
  });
  const redact = security?.piiRedactionEnabled === true;
  const storedUserContent = maybeRedactPii(message, redact);

  const userMessage = await prisma.message.create({
    data: { sessionId, role: "USER", content: storedUserContent },
  });

  const effectiveMessage = context ? `[Context: ${context}]\n${message}` : message;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(encodeChatSse(event)));
      };

      try {
        emit({
          type: "meta",
          sessionId,
          userMessage: {
            id: userMessage.id,
            role: "USER",
            content: message,
            createdAt: userMessage.createdAt.toISOString(),
          },
        });

        const processResult = await processMessage({
          orgId,
          agentId,
          sessionId,
          message: effectiveMessage,
          onStreamEvent: (event) => emit(event),
        });

        const { botContent, escalation, customerFacingMessage } = processResult;
        const replyContent =
          escalation?.shouldEscalate && customerFacingMessage
            ? customerFacingMessage
            : botContent;

        const botMessage = await prisma.message.create({
          data: {
            sessionId,
            role: "BOT",
            content: maybeRedactPii(replyContent, redact),
          },
        });

        const side = await resolveChatReplySideEffects({
          orgId,
          agentId,
          sessionId,
          processResult,
          replyContent,
          includeSuggestions: false,
        });

        const { formUi, sessionStatus, escalationPayload } = side;

        emit({
          type: "done",
          message: {
            id: botMessage.id,
            role: "BOT",
            content: replyContent,
            createdAt: botMessage.createdAt.toISOString(),
            ...(formUi ? { ui: formUi } : {}),
          },
          ...(formUi ? { ui: formUi } : {}),
          ...(sessionStatus ? { sessionStatus } : {}),
          ...(escalationPayload ? { escalation: escalationPayload } : {}),
        });

        const agent = await loadWebChatAgent(agentId, orgId);
        const userMessageCount = await prisma.message.count({
          where: { sessionId, role: "USER" },
        });
        const suggestedMessages = await resolveSuggestedMessages({
          agent,
          sessionId,
          userMessageCount,
          replyContent,
          shouldEscalate: Boolean(escalation?.shouldEscalate),
        });
        if (suggestedMessages !== undefined) {
          emit({ type: "suggestions", suggestedMessages });
        }
      } catch {
        emit({ type: "error", message: "Internal server error" });
      } finally {
        controller.close();
      }
    },
  });

  return { ok: true, stream };
}
