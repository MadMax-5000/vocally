import type { SessionStatus } from "@prisma/client";

import type { ChatFormUi } from "@/lib/chat/form-ui";

export type ChatStreamUserMessage = {
  id: string;
  role: "USER";
  content: string;
  createdAt: string;
};

export type ChatStreamBotMessage = {
  id: string;
  role: "BOT";
  content: string;
  createdAt: string;
  ui?: ChatFormUi;
};

export type ChatStreamEscalation = {
  escalated: true;
  trigger: string;
  message: string;
  sessionStatus: "ESCALATED";
  ticketId?: string;
};

export type ChatStreamEvent =
  | {
      type: "meta";
      sessionId: string;
      userMessage: ChatStreamUserMessage;
    }
  | { type: "status"; phase: "thinking" | "tools" }
  | { type: "delta"; text: string }
  | {
      type: "done";
      message: ChatStreamBotMessage;
      ui?: ChatFormUi;
      sessionStatus?: SessionStatus;
      escalation?: ChatStreamEscalation;
    }
  | { type: "suggestions"; suggestedMessages: string[] }
  | { type: "error"; message: string };
