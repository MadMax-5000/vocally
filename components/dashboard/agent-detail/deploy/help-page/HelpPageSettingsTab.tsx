"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { UploadIcon } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  HELP_PAGE_HEADLINE_DEFAULT,
  HELP_PAGE_PLACEHOLDER_DEFAULT,
  WIDGET_PRIMARY_COLOR_DEFAULT,
} from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import { ChatWidgetColorField } from "../chat-widget/ChatWidgetColorField";
import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "../chat-widget/ChatWidgetSettingRow";
import { HelpPageNavLinksEditor } from "./HelpPageNavLinksEditor";
import type { HelpPageDraft } from "./help-page-draft";
import type { WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";

type HelpPageSettingsTabProps = {
  draft: HelpPageDraft;
  onChange: (draft: HelpPageDraft) => void;
  agentName: string;
};

function ThemeSegment({
  value,
  onChange,
}: {
  value: WebChatHelpPageTheme;
  onChange: (v: WebChatHelpPageTheme) => void;
}) {
  const options: { id: WebChatHelpPageTheme; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-body-sm transition-colors",
            value === opt.id
              ? "bg-surface-card font-medium text-ink shadow-sm"
              : "text-muted hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function UploadStubField({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <ChatWidgetSettingRow label={label} description={description}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="h-10 w-fit gap-1.5 rounded-lg border-hairline bg-surface-card text-body-sm"
      >
        <AppIcon icon={UploadIcon} className="size-3.5" />
        Upload
      </Button>
    </ChatWidgetSettingRow>
  );
}

export function HelpPageSettingsTab({ draft, onChange, agentName }: HelpPageSettingsTabProps) {
  const hp = draft.helpPage;

  function patchHelpPage(partial: Partial<HelpPageDraft["helpPage"]>) {
    onChange({ ...draft, helpPage: { ...hp, ...partial } });
  }

  return (
    <div>
      <ChatWidgetSettingRow
        label="Page title"
        description="Shown in the browser tab."
        noBorder
      >
        <Input
          value={hp.pageTitle}
          onChange={(e) => patchHelpPage({ pageTitle: e.target.value })}
          className={chatWidgetFieldInputClass}
          placeholder={agentName}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Headline"
        description="Large text above the chat input on the help page."
      >
        <Input
          value={hp.headline}
          onChange={(e) => patchHelpPage({ headline: e.target.value })}
          className={chatWidgetFieldInputClass}
          placeholder={HELP_PAGE_HEADLINE_DEFAULT}
        />
      </ChatWidgetSettingRow>

      <HelpPageNavLinksEditor
        links={hp.navLinks}
        onChange={(navLinks) => patchHelpPage({ navLinks })}
      />

      <UploadStubField
        label="Favicon"
        description="ICO, PNG, or SVG up to 1MB. Shown in the browser tab."
      />

      <ChatWidgetSettingRow label="Message placeholder">
        <Input
          value={hp.placeholder}
          onChange={(e) => patchHelpPage({ placeholder: e.target.value })}
          className={chatWidgetFieldInputClass}
          placeholder={HELP_PAGE_PLACEHOLDER_DEFAULT}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Enable theme switch"
        description="Let visitors toggle between light and dark mode."
        variant="row"
      >
        <Switch
          checked={hp.themeSwitchEnabled}
          onCheckedChange={(themeSwitchEnabled) => patchHelpPage({ themeSwitchEnabled })}
          aria-label="Enable theme switch"
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Default theme">
        <ThemeSegment
          value={hp.defaultTheme}
          onChange={(defaultTheme) => patchHelpPage({ defaultTheme })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Light primary color">
        <ChatWidgetColorField
          value={hp.primaryColorLight}
          defaultValue={WIDGET_PRIMARY_COLOR_DEFAULT}
          onChange={(primaryColorLight) => patchHelpPage({ primaryColorLight })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Dark primary color">
        <ChatWidgetColorField
          value={hp.primaryColorDark}
          defaultValue={WIDGET_PRIMARY_COLOR_DEFAULT}
          onChange={(primaryColorDark) => patchHelpPage({ primaryColorDark })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label="Enable voice to text"
        description="Show a microphone button in the chat input. Speech is transcribed into the message field."
        variant="row"
      >
        <Switch
          checked={hp.voiceToTextEnabled}
          onCheckedChange={(voiceToTextEnabled) => patchHelpPage({ voiceToTextEnabled })}
          aria-label="Enable voice to text"
        />
      </ChatWidgetSettingRow>

      <UploadStubField
        label="Logo"
        description="Shown in the sidebar on light backgrounds. JPG, PNG, or SVG up to 1MB."
      />

      <UploadStubField
        label="Logo (dark mode)"
        description="Shown in the sidebar on dark backgrounds."
      />

      <UploadStubField
        label="Hero image"
        description="Centered above the headline on light backgrounds."
      />

      <UploadStubField
        label="Hero image (dark mode)"
        description="Centered above the headline on dark backgrounds."
      />
    </div>
  );
}
