import { createHmac, timingSafeEqual } from "crypto";

export function verifyMetaWebhookToken(token: string | null): boolean {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    throw new Error("META_WEBHOOK_VERIFY_TOKEN is not configured");
  }
  return token === expected;
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET is not configured");
  if (!signatureHeader) return false;
  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const receivedHex = signatureHeader.slice(prefix.length).trim();
  if (!receivedHex) return false;

  const expectedHex = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  try {
    const a = Buffer.from(receivedHex, "hex");
    const b = Buffer.from(expectedHex, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type InstagramWebhookPayload = {
  object?: string;
  entry?: unknown[];
};

export type InstagramInboundTextMessage = {
  pageId: string;
  senderId: string;
  recipientId: string;
  messageId: string;
  text: string;
};

/**
 * Parses Instagram DM webhook payloads from Meta. We keep this tolerant because
 * Meta may deliver Instagram Messaging events under a `page` object (linked Page)
 * and/or slightly different shapes depending on setup.
 */
export function extractInstagramInboundTextMessages(
  parsed: unknown,
): InstagramInboundTextMessage[] {
  const payload = parsed as InstagramWebhookPayload;
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const out: InstagramInboundTextMessage[] = [];

  for (const entry of entries) {
    if (typeof entry !== "object" || !entry) continue;
    const pageId = typeof (entry as any).id === "string" ? (entry as any).id : null;
    if (!pageId) continue;

    const messaging = Array.isArray((entry as any).messaging) ? (entry as any).messaging : [];
    for (const evt of messaging) {
      const senderId = typeof evt?.sender?.id === "string" ? evt.sender.id : null;
      const recipientId = typeof evt?.recipient?.id === "string" ? evt.recipient.id : null;
      const messageId = typeof evt?.message?.mid === "string" ? evt.message.mid : null;
      const text = typeof evt?.message?.text === "string" ? evt.message.text : null;

      const isEcho = evt?.message?.is_echo === true || evt?.message?.is_self === true;

      if (!senderId || !recipientId || !messageId || !text) continue;
      if (isEcho) continue; // don’t auto-reply to our own messages

      out.push({
        pageId,
        senderId,
        recipientId,
        messageId,
        text,
      });
    }
  }

  return out;
}

