import type { AgentChannel } from "@prisma/client";

export type EmailChannelConfig = {
  signature?: string;
  replySubjectPrefix?: string;
  autoReplyEnabled?: boolean;
};

export const EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT = "Re:";

export function getEmailChannelConfig(channels: AgentChannel[]): EmailChannelConfig {
  const row = channels.find((c) => c.channel === "EMAIL");
  if (!row?.config || typeof row.config !== "object" || Array.isArray(row.config)) {
    return {};
  }
  const raw = row.config as Record<string, unknown>;
  const email =
    raw.email && typeof raw.email === "object" && !Array.isArray(raw.email)
      ? (raw.email as Record<string, unknown>)
      : raw;

  const signature = typeof email.signature === "string" ? email.signature : undefined;
  const replySubjectPrefix =
    typeof email.replySubjectPrefix === "string" ? email.replySubjectPrefix : undefined;
  const autoReplyEnabled =
    typeof email.autoReplyEnabled === "boolean" ? email.autoReplyEnabled : undefined;

  return { signature, replySubjectPrefix, autoReplyEnabled };
}

export function isEmailChannelEnabled(channels: AgentChannel[]): boolean {
  return channels.some((c) => c.channel === "EMAIL" && c.enabled);
}

export function parseLabelIds(value: unknown): string[] {
  if (!Array.isArray(value)) return ["INBOX"];
  const ids = value.filter((v): v is string => typeof v === "string" && v.length > 0);
  return ids.length > 0 ? ids : ["INBOX"];
}
