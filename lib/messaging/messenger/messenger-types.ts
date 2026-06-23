export type MetaMessengerWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string; // Page ID
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
      };
    }>;
  }>;
};

