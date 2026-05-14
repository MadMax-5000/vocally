export type IncomingSmsPayload = {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
};

export type ResolvedSession = {
  sessionId: string;
  orgId: string;
  agentId: string | null;
  isNew: boolean;
};
