export type InboundEmailPayload = {
  subject: string;
  from: string;
  to: string[];
  text?: string;
  html?: string;
  messageId?: string;
};

export type ResolvedEmailSession = {
  sessionId: string;
  orgId: string;
  agentId: string | null;
  isNew: boolean;
};
