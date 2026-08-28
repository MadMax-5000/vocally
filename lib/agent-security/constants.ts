export const MAX_ALLOWED_HOSTNAMES = 10;
export const MIN_CHAT_RATE_LIMIT_PER_MINUTE = 1;
export const MAX_CHAT_RATE_LIMIT_PER_MINUTE = 120;

export const CONVERSATION_RETENTION_DAYS = [7, 30, 90, 365] as const;
export type ConversationRetentionDays =
  (typeof CONVERSATION_RETENTION_DAYS)[number];

export const RATE_LIMIT_EXCEEDED_ERROR = "Too many messages. Try again in a moment.";
export const ORIGIN_NOT_ALLOWED_ERROR = "This agent is not allowed on this domain.";
