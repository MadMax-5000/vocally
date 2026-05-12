export type IncomingWhatsAppPayload = {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  ProfileName?: string;
  WaId?: string;
  NumMedia?: string;
  Forwarded?: string;
  FrequentlyForwarded?: string;
};

export type ResolvedSession = {
  sessionId: string;
  orgId: string;
  agentId: string | null;
  isNew: boolean;
};
