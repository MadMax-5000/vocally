"use client";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.deploy.generic");
  function patch(partial: Partial<EmailDraft>) {
    onChange({ ...draft, ...partial });
  }

  return (
    <div>
      <ChatWidgetSettingRow
        label={t("autoReply")}
        description={t("autoReplyDescription")}
        variant="row"
      >
        <Switch
          checked={draft.autoReplyEnabled}
          onCheckedChange={(v) => patch({ autoReplyEnabled: v })}
          aria-label={t("autoReply")}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t("replySubjectPrefix")}
        description={t("replySubjectPrefixDescription")}
      >
        <Input
          className={chatWidgetFieldInputClass}
          value={draft.replySubjectPrefix}
          onChange={(e) => patch({ replySubjectPrefix: e.target.value })}
          maxLength={20}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t("emailSignature")}
        description={t("emailSignatureDescription")}
        noBorder={!hasConnection}
      >
        <Textarea
          className={chatWidgetFieldTextareaClass}
          value={draft.signature}
          onChange={(e) => patch({ signature: e.target.value })}
          rows={4}
          maxLength={2000}
          placeholder={t("emailSignaturePlaceholder")}
        />
      </ChatWidgetSettingRow>

      {hasConnection ? (
        <ChatWidgetSettingRow
          label={t("watchLabels")}
          description={t("watchLabelsDescription")}
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
