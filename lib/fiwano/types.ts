export type FiwanoEventType =
  | "message.received"
  | "message.delivered"
  | "message.read"
  | "message.sent"
  | "message.failed";

export type FiwanoChannelType = "whatsapp" | "instagram" | "facebook";

export type FiwanoWebhookPayload = {
  event: FiwanoEventType;
  channel_id: string;
  data: {
    id: string;
    from: string;
    from_name?: string;
    text?: string;
    timestamp: string;
    message_id?: string;
    channel_type: FiwanoChannelType;
  };
};

export type FiwanoSendTextResponse = {
  success: boolean;
  message_id: string;
  status: "sent" | "queued" | "failed";
  error_code?: number;
};

export type FiwanoChannelInfo = {
  id: string;
  channel_type: FiwanoChannelType;
  name: string;
  is_active: boolean;
  ig_username?: string | null;
  page_name?: string | null;
  webhook_url: string | null;
  has_webhook_secret: boolean;
  webhook_events: string[];
  connected_at: string;
  subscription: {
    status: string;
    source: string;
    tier: string;
    expires_at: string;
    auto_renew: boolean;
  };
};
