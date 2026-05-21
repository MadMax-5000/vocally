export type InboundEmailPayload = {
  subject: string;
  from: string;
  to: string[];
  text?: string;
  html?: string;
  messageId?: string;
  /** Address that received the message (normalized). Used as Resend `from` when verified for that inbox. */
  replyFromEmail?: string;
};

export type ResolvedEmailSession = {
  sessionId: string;
  orgId: string;
  agentId: string | null;
  isNew: boolean;
};
