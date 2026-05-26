import type { gmail_v1 } from "googleapis";

import { EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT } from "@/lib/deploy/email-channel-config";

function toBase64Url(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function formatSubject(original: string, prefix: string): string {
  const trimmed = original.trim();
  const normalizedPrefix = prefix.trim() || EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT;
  if (new RegExp(`^${normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s`, "i").test(trimmed)) {
    return trimmed;
  }
  return `${normalizedPrefix} ${trimmed}`;
}

export function buildRawEmail(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string | null;
  references?: string | null;
}): string {
  const lines: string[] = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
  ];

  if (params.inReplyTo) {
    lines.push(`In-Reply-To: ${params.inReplyTo}`);
  }
  if (params.references) {
    lines.push(`References: ${params.references}`);
  }

  lines.push("", params.body);
  return lines.join("\r\n");
}

export async function sendGmailMessage(
  gmail: gmail_v1.Gmail,
  params: {
    from: string;
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string | null;
    references?: string | null;
  },
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawEmail(params);
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: toBase64Url(raw),
      threadId: params.threadId,
    },
  });

  if (!res.data.id) {
    throw new Error("Gmail send did not return message id");
  }

  return {
    id: res.data.id,
    threadId: res.data.threadId ?? params.threadId ?? res.data.id,
  };
}

export function buildReplySubject(
  originalSubject: string,
  prefix: string | undefined,
): string {
  return formatSubject(originalSubject, prefix ?? EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT);
}

export function appendSignature(body: string, signature: string | undefined): string {
  const sig = signature?.trim();
  if (!sig) return body;
  return `${body.trim()}\n\n--\n${sig}`;
}
