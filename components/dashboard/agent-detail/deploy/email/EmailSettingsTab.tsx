"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { GmailLabelOption } from "@/lib/actions/gmail-connection";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "../chat-widget/ChatWidgetSettingRow";

import { EmailLabelPicker } from "./EmailLabelPicker";
import type { EmailDraft } from "./email-draft";

type EmailSettingsTabProps = {
  draft: EmailDraft;
  onChange: (draft: EmailDraft) => void;
  hasConnection: boolean;
  labelOptions: GmailLabelOption[];
  labelsLoading: boolean;
  labelsError: string | null;
};

export function EmailSettingsTab({
  draft,
  onChange,
  hasConnection,
  labelOptions,
  labelsLoading,
  labelsError,
}: EmailSettingsTabProps) {
  function patch(partial: Partial<EmailDraft>) {
    onChange({ ...draft, ...partial });
  }

  return (
    <div>
      <ChatWidgetSettingRow
        label="Auto-reply"
        description="When off, inbound emails are still logged but the agent will not send AI replies."
        variant="row"
      >
        <Switch
          checked={draft.autoReplyEnabled}
          onCheckedChange={(v) => patch({ autoReplyEnabled: v })}
          aria-label="Auto-reply to inbound email"
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Reply subject prefix"
        description='Prepended to customer subjects (e.g. "Re:").'
      >
        <Input
          className={chatWidgetFieldInputClass}
          value={draft.replySubjectPrefix}
          onChange={(e) => patch({ replySubjectPrefix: e.target.value })}
          maxLength={20}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Email signature"
        description="Appended to outbound replies from this agent."
        noBorder={!hasConnection}
      >
        <Textarea
          className={chatWidgetFieldTextareaClass}
          value={draft.signature}
          onChange={(e) => patch({ signature: e.target.value })}
          rows={4}
          maxLength={2000}
          placeholder="Thanks,&#10;Support Team"
        />
      </ChatWidgetSettingRow>

      {hasConnection ? (
        <ChatWidgetSettingRow
          label="Watch labels"
          description="Only emails with these Gmail labels trigger the agent. Saving restarts the mailbox watch."
          className="mt-2 border-t border-hairline pt-4"
          noBorder
        >
          <EmailLabelPicker
            options={labelOptions}
            selectedIds={draft.labelIds}
            onChange={(labelIds) => patch({ labelIds })}
            loading={labelsLoading}
            error={labelsError}
          />
        </ChatWidgetSettingRow>
      ) : null}
    </div>
  );
}
