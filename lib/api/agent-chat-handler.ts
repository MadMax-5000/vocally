import type { Agent, AgentChannel, SessionStatus } from "@prisma/client";

import { processMessage } from "@/lib/ai/process-message";
import { generateDynamicSuggestedMessages } from "@/lib/ai/generate-suggested-messages";
import { isApiDeploymentEnabled } from "@/lib/deploy/api-config";
import type { ChatFormUi } from "@/lib/chat/form-ui";
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

export async function handleAgentChatMessage({
  orgId,
  agentId,
  sessionId: existingSessionId,
  message,
  deployment = "widget",
}: HandleAgentChatMessageInput): Promise<HandleAgentChatMessageResult> {
  let sessionId = existingSessionId;

  if (sessionId) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.orgId !== orgId) {
      return {
        ok: false,
        error: { status: 404, message: "Session not found" },
      };
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
    data: { sessionId, role: "USER", content: message },
  });

  const processResult = await processMessage({
    orgId,
    agentId,
    sessionId,
    message,
  });

  const { botContent, escalation, customerFacingMessage, ticketId, formRequest } =
    processResult;
  const replyContent =
    escalation?.shouldEscalate && customerFacingMessage
      ? customerFacingMessage
      : botContent;

  const botMessage = await prisma.message.create({
    data: { sessionId, role: "BOT", content: replyContent },
  });

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, orgId },
    include: {
      channels: { where: { channel: "WEB_CHAT" } },
    },
  });

  let suggestedMessages: string[] | undefined;
  let formUi: ChatFormUi | undefined = formRequest ?? undefined;

  const userMessageCount = await prisma.message.count({
    where: { sessionId, role: "USER" },
  });

  if (agent) {
    const channels = agent.channels;
    const action = resolveSuggestedMessagesAction(channels);

    if (action.enabled) {
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

      suggestedMessages = mergeSuggestedMessagesForResponse({
        action,
        userMessageCount,
        dynamicSuggestions,
      });
    }

    if (!formUi && !escalation?.shouldEscalate) {
      const customForm = resolveCustomFormAction(channels);
      const threshold = customForm.showAfterUserMessages;
      if (
        customForm.enabled &&
        isCustomFormConfigured(customForm) &&
        threshold !== null &&
        userMessageCount === threshold
      ) {
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
      }
    }
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  const sessionStatus = session?.status;

  const escalationPayload =
    escalation?.shouldEscalate && escalation.trigger
      ? {
          escalated: true as const,
          trigger: escalation.trigger,
          message: customerFacingMessage ?? replyContent,
          sessionStatus: "ESCALATED" as const,
          ...(ticketId ? { ticketId } : {}),
        }
      : undefined;

  if (escalationPayload) {
    suggestedMessages = [];
  }

  return {
    ok: true,
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
        ...(formUi ? { ui: formUi } : {}),
      },
      ...(formUi ? { ui: formUi } : {}),
      ...(sessionStatus ? { sessionStatus } : {}),
      ...(escalationPayload ? { escalation: escalationPayload } : {}),
      ...(suggestedMessages !== undefined ? { suggestedMessages } : {}),
    },
  };
}
