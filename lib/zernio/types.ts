export type ZernioEvent =
  | "message.received"
  | "message.sent"
  | "message.edited"
  | "message.deleted"
  | "message.delivered"
  | "message.read"
  | "message.failed"
  | "conversation.started"
  | "reaction.received";

export type ZernioPlatform = "instagram" | "facebook" | "whatsapp" | "telegram" | "twitter" | "bluesky" | "reddit";

export type ZernioWebhookPayload = {
  id: string;
  event: ZernioEvent;
  message: {
    id: string;
    conversationId: string;
    platform: ZernioPlatform;
    platformMessageId: string;
    direction: "incoming" | "outgoing";
    text: string | null;
    sender: {
      id: string;
      name: string | null;
      username: string | null;
    };
    attachments: Array<{ type: string; url: string }>;
    sentAt: string;
    isRead: boolean;
  };
  conversation: {
    id: string;
    platform: ZernioPlatform;
    participantId: string;
    participantName: string | null;
    participantUsername: string | null;
    status: string;
  };
  account: {
    id: string;
    platform: ZernioPlatform;
    username: string;
    displayName: string | null;
  };
  metadata: Record<string, unknown> | null;
  timestamp: string;
};

export type ZernioConnectUrlResponse = {
  authUrl: string;
  state: string;
};

export type ZernioSendMessageResponse = {
  success: boolean;
  messageId: string;
};

export const ZERNIO_BASE = "https://zernio.com/api";
export const ZERNIO_DEFAULT_PROFILE_ID = "6a57d22ba801163d626cd0ca";
