import { createHmac, timingSafeEqual } from "crypto";

export type AssemblyAiSessionPayload = {
  session_id: string;
  account_id?: number;
  agent_id?: string;
  status?: string;
  duration_seconds?: number;
  public_close_reason?: string;
  created_at?: string;
  ended_at?: string;
};

export type AssemblyAiCallPayload = {
  call_id: string;
  account_id?: number;
  agent_id?: string;
  status?: string;
  direction?: string;
  from_number?: string;
  to_number?: string;
  session_id?: string;
  recording_url?: string;
  transcript_url?: string;
  created_at?: string;
  ended_at?: string;
};

export type AssemblyAiWebhookEvent = {
  event_id?: string;
  event: string;
  timestamp?: string;
  session?: AssemblyAiSessionPayload;
  call?: AssemblyAiCallPayload;
};

export function verifyAssemblyAiSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const body = typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseAssemblyAiWebhookEvent(payload: unknown): AssemblyAiWebhookEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const event = typeof record.event === "string" ? record.event : null;
  if (!event) return null;

  return {
    event_id: typeof record.event_id === "string" ? record.event_id : undefined,
    event,
    timestamp: typeof record.timestamp === "string" ? record.timestamp : undefined,
    session: isSessionPayload(record.session) ? record.session : undefined,
    call: isCallPayload(record.call) ? record.call : undefined,
  };
}

function isSessionPayload(value: unknown): value is AssemblyAiSessionPayload {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { session_id?: unknown }).session_id === "string";
}

function isCallPayload(value: unknown): value is AssemblyAiCallPayload {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { call_id?: unknown }).call_id === "string";
}
