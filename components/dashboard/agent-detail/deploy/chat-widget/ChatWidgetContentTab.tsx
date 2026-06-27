"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
  chatWidgetFieldTextareaClass,
} from "./ChatWidgetSettingRow";
import { ChatWidgetSuggestedMessages } from "./ChatWidgetSuggestedMessages";
import type { ChatWidgetDraft } from "./chat-widget-draft";

type ChatWidgetContentTabProps = {
  draft: ChatWidgetDraft;
  onChange: (draft: ChatWidgetDraft) => void;
};

export function ChatWidgetContentTab({ draft, onChange }: ChatWidgetContentTabProps) {
  const w = draft.widget;

  function patchWidget(partial: Partial<ChatWidgetDraft["widget"]>) {
    onChange({ ...draft, widget: { ...w, ...partial } });
  }

  return (
    <div>
      <ChatWidgetSettingRow label="Display name" noBorder>
        <Input
          value={w.displayName}
          onChange={(e) => patchWidget({ displayName: e.target.value })}
          placeholder="Widget title"
          className={chatWidgetFieldInputClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Initial message">
        <Textarea
          value={draft.welcomeMessage}
          onChange={(e) => onChange({ ...draft, welcomeMessage: e.target.value })}
          rows={3}
          className={chatWidgetFieldTextareaClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Use different initial message on mobile"
        tooltip="Shown when the widget detects a mobile viewport."
        variant="row"
      >
        <Switch
          checked={w.useMobileWelcome}
          onCheckedChange={(checked) => patchWidget({ useMobileWelcome: checked })}
        />
      </ChatWidgetSettingRow>

      {w.useMobileWelcome ? (
        <ChatWidgetSettingRow label="Mobile initial message">
          <Textarea
            value={w.welcomeMessageMobile}
            onChange={(e) => patchWidget({ welcomeMessageMobile: e.target.value })}
            rows={3}
            className={chatWidgetFieldTextareaClass}
          />
        </ChatWidgetSettingRow>
      ) : null}

      <ChatWidgetSettingRow
        label="Auto-show welcome pop-up"
        tooltip="Show a proactive message bubble before the visitor opens the chat."
        variant="row"
      >
        <Switch
          checked={w.autoShowWelcomePopup}
          onCheckedChange={(checked) => patchWidget({ autoShowWelcomePopup: checked })}
        />
      </ChatWidgetSettingRow>

      {w.autoShowWelcomePopup ? (
        <ChatWidgetSettingRow
          label="Delay (seconds)"
          description="Time before the pop-up appears."
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

      <ChatWidgetSettingRow label="Auto pop-up on mobile" variant="row">
        <Switch
          checked={w.autoShowWelcomePopupMobile}
          onCheckedChange={(checked) =>
            patchWidget({ autoShowWelcomePopupMobile: checked })
          }
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSuggestedMessages
        messages={w.suggestedMessages}
        keepShowing={w.keepShowingSuggested}
        onMessagesChange={(suggestedMessages) => patchWidget({ suggestedMessages })}
        onKeepShowingChange={(keepShowingSuggested) =>
          patchWidget({ keepShowingSuggested })
        }
      />

      <ChatWidgetSettingRow label="Message placeholder">
        <Input
          value={w.placeholder}
          onChange={(e) => patchWidget({ placeholder: e.target.value })}
          className={chatWidgetFieldInputClass}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Enable voice-to-text"
        description="Show a microphone button in the chat input. Speech is transcribed into the message field."
        variant="row"
      >
        <Switch
          checked={w.voiceToTextEnabled}
          onCheckedChange={(checked) => patchWidget({ voiceToTextEnabled: checked })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Enable attachments"
        description="Coming soon"
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
