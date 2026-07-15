const FIWANO_BASE = "https://fiwano.com";
const FIWANO_API_KEY = process.env.FIWANO_API_KEY;

export class FiwanoError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "FiwanoError";
  }
}

async function fiwanoFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!FIWANO_API_KEY) throw new FiwanoError("FIWANO_API_KEY not configured");

  const url = `${FIWANO_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": FIWANO_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new FiwanoError(
      body?.detail ?? `Fiwano API error: ${res.status}`,
      res.status,
      body?.code,
    );
  }

  return res.json();
}

export async function sendFiwanoText(
  channelId: string,
  recipient: string,
  text: string,
): Promise<{ success: boolean; message_id: string; status: string }> {
  return fiwanoFetch("/api/v1/messages/send", {
    method: "POST",
    body: JSON.stringify({ channel_id: channelId, recipient, text }),
  });
}

export async function getFiwanoChannels(): Promise<{
  channels: Array<{
    id: string;
    channel_type: string;
    name: string;
    is_active: boolean;
    ig_username?: string | null;
    page_id?: string | null;
    webhook_url: string | null;
    has_webhook_secret: boolean;
    webhook_events: string[];
    connected_at: string;
    subscription: { status: string; source: string; tier: string };
  }>;
  total: number;
}> {
  return fiwanoFetch("/api/v1/channels");
}
