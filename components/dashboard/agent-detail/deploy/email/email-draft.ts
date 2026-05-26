import {
  EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT,
  getEmailChannelConfig,
  parseLabelIds,
} from "@/lib/deploy/email-channel-config";

import type { AgentDetailWithRelations } from "../../agent-detail-types";
import type { AgentGmailSettings } from "@/lib/actions/gmail-connection";

export type EmailDraft = {
  signature: string;
  replySubjectPrefix: string;
  autoReplyEnabled: boolean;
  labelIds: string[];
};

export function buildEmailDraft(
  agent: AgentDetailWithRelations,
  gmailSettings?: AgentGmailSettings | null,
): EmailDraft {
  const config = getEmailChannelConfig(agent.channels);
  return {
    signature: config.signature ?? "",
    replySubjectPrefix: config.replySubjectPrefix ?? EMAIL_REPLY_SUBJECT_PREFIX_DEFAULT,
    autoReplyEnabled: config.autoReplyEnabled ?? true,
    labelIds:
      gmailSettings?.connection?.labelIds ??
      parseLabelIds(agent.gmailConnection?.labelIds),
  };
}

export function draftsEqual(a: EmailDraft, b: EmailDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function draftToSavePayload(draft: EmailDraft) {
  return {
    signature: draft.signature,
    replySubjectPrefix: draft.replySubjectPrefix,
    autoReplyEnabled: draft.autoReplyEnabled,
    labelIds: draft.labelIds,
  };
}
