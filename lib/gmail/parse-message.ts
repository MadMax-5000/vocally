import type { gmail_v1 } from "googleapis";

import { plainTextFromInboundParts } from "@/lib/email/email-body";

export type ParsedGmailMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  messageIdHeader: string | null;
  inReplyTo: string | null;
  references: string | null;
};

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  const found = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value?.trim() ?? null;
}

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractBodyFromPart(part: gmail_v1.Schema$MessagePart): { text?: string; html?: string } {
  let text: string | undefined;
  let html: string | undefined;

  if (part.mimeType === "text/plain" && part.body?.data) {
    text = decodeBase64Url(part.body.data);
  } else if (part.mimeType === "text/html" && part.body?.data) {
    html = decodeBase64Url(part.body.data);
  }

  if (part.parts) {
    for (const child of part.parts) {
      const nested = extractBodyFromPart(child);
      text = text ?? nested.text;
      html = html ?? nested.html;
    }
  }

  return { text, html };
}

export function parseGmailMessage(msg: gmail_v1.Schema$Message): ParsedGmailMessage | null {
  if (!msg.id || !msg.threadId || !msg.payload) return null;

  const headers = msg.payload.headers;
  const fromRaw = getHeader(headers, "From");
  if (!fromRaw) return null;

  const toRaw = getHeader(headers, "To") ?? "";
  const toList = toRaw
    .split(",")
    .map((s) => extractEmailAddress(s))
    .filter(Boolean);

  const { text, html } = extractBodyFromPart(msg.payload);
  const body = plainTextFromInboundParts(text, html);
  if (!body) return null;

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: extractEmailAddress(fromRaw),
    to: toList,
    subject: getHeader(headers, "Subject") ?? "(no subject)",
    body,
    messageIdHeader: getHeader(headers, "Message-ID"),
    inReplyTo: getHeader(headers, "In-Reply-To"),
    references: getHeader(headers, "References"),
  };
}
