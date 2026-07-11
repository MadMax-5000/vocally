"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "./ChatWidgetSettingRow";
import type { ChatWidgetDraft } from "./chat-widget-draft";

type ChatWidgetContentTabProps = {
  draft: ChatWidgetDraft;
  onChange: (draft: ChatWidgetDraft) => void;
};

export function ChatWidgetContentTab({ draft, onChange }: ChatWidgetContentTabProps) {
  const t = useTranslations("dashboard.deploy.generic");
  const w = draft.widget;

  function patchWidget(partial: Partial<ChatWidgetDraft["widget"]>) {
    onChange({ ...draft, widget: { ...w, ...partial } });
  }

  return (
    <div>
      <ChatWidgetSettingRow label={t("displayName")} noBorder>
        <Input
          value={w.displayName}
          onChange={(e) => patchWidget({ displayName: e.target.value })}
          placeholder={t("widgetTitle")}
          className={chatWidgetFieldInputClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label={t("initialMessage")}>
        <Textarea
          value={draft.welcomeMessage}
          onChange={(e) => onChange({ ...draft, welcomeMessage: e.target.value })}
          rows={3}
          className={chatWidgetFieldTextareaClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t("differentMobileWelcome")}
        tooltip={t("differentMobileWelcomeHint")}
        variant="row"
      >
        <Switch
          checked={w.useMobileWelcome}
          onCheckedChange={(checked) => patchWidget({ useMobileWelcome: checked })}
        />
      </ChatWidgetSettingRow>

      {w.useMobileWelcome ? (
        <ChatWidgetSettingRow label={t("mobileInitialMessage")}>
          <Textarea
            value={w.welcomeMessageMobile}
            onChange={(e) => patchWidget({ welcomeMessageMobile: e.target.value })}
            rows={3}
            className={chatWidgetFieldTextareaClass}
          />
        </ChatWidgetSettingRow>
      ) : null}

      <ChatWidgetSettingRow
        label={t("autoShowWelcome")}
        tooltip={t("autoShowWelcomeHint")}
        variant="row"
      >
        <Switch
          checked={w.autoShowWelcomePopup}
          onCheckedChange={(checked) => patchWidget({ autoShowWelcomePopup: checked })}
        />
      </ChatWidgetSettingRow>

      {w.autoShowWelcomePopup ? (
        <ChatWidgetSettingRow
          label={t("delay")}
          description={t("delayHint")}
        >
          <Input
            type="number"
            min={1}
            max={60}
            value={w.welcomePopupDelaySec}
            onChange={(e) =>
              patchWidget({
                welcomePopupDelaySec: Math.min(
                  60,
                  Math.max(1, Number.parseInt(e.target.value, 10) || 3),
                ),
              })
            }
            className={`${chatWidgetFieldInputClass} max-w-[120px]`}
          />
        </ChatWidgetSettingRow>
      ) : null}

      <ChatWidgetSettingRow label={t("autoPopupMobile")} variant="row">
        <Switch
          checked={w.autoShowWelcomePopupMobile}
          onCheckedChange={(checked) =>
            patchWidget({ autoShowWelcomePopupMobile: checked })
          }
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label={t("messagePlaceholder")}>
        <Input
          value={w.placeholder}
          onChange={(e) => patchWidget({ placeholder: e.target.value })}
          className={chatWidgetFieldInputClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t("voiceToText")}
        description={t("voiceToTextHint")}
        variant="row"
      >
        <Switch
          checked={w.voiceToTextEnabled}
          onCheckedChange={(checked) => patchWidget({ voiceToTextEnabled: checked })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t("attachments")}
        description={t("comingSoon")}
        variant="row"
        noBorder
      >
        <Switch
          checked={w.attachmentsEnabled}
          onCheckedChange={(checked) => patchWidget({ attachmentsEnabled: checked })}
          disabled
        />
      </ChatWidgetSettingRow>
    </div>
  );
}
