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
import { useDeploySitesMessages } from "../useDeploySitesMessages";

type HelpPageSettingsTabProps = {
  draft: HelpPageDraft;
  onChange: (draft: HelpPageDraft) => void;
  agentName: string;
};

function ThemeSegment({
  value,
  onChange,
  labels,
}: {
  value: WebChatHelpPageTheme;
  onChange: (v: WebChatHelpPageTheme) => void;
  labels: { light: string; dark: string };
}) {
  const options: { id: WebChatHelpPageTheme; label: string }[] = [
    { id: "light", label: labels.light },
    { id: "dark", label: labels.dark },
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
  uploadLabel,
}: {
  label: string;
  description: string;
  uploadLabel: string;
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
        {uploadLabel}
      </Button>
    </ChatWidgetSettingRow>
  );
}

export function HelpPageSettingsTab({ draft, onChange, agentName }: HelpPageSettingsTabProps) {
  const t = useDeploySitesMessages().helpPage.settings;
  const hp = draft.helpPage;

  function patchHelpPage(partial: Partial<HelpPageDraft["helpPage"]>) {
    onChange({ ...draft, helpPage: { ...hp, ...partial } });
  }

  return (
    <div>
      <ChatWidgetSettingRow
        label={t.pageTitle}
        description={t.pageTitleDescription}
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
        label={t.headline}
        description={t.headlineDescription}
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
        label={t.favicon}
        description={t.faviconDescription}
        uploadLabel={t.upload}
      />

      <ChatWidgetSettingRow label={t.messagePlaceholder}>
        <Input
          value={hp.placeholder}
          onChange={(e) => patchHelpPage({ placeholder: e.target.value })}
          className={chatWidgetFieldInputClass}
          placeholder={HELP_PAGE_PLACEHOLDER_DEFAULT}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t.enableThemeSwitch}
        description={t.themeSwitchDescription}
        variant="row"
      >
        <Switch
          checked={hp.themeSwitchEnabled}
          onCheckedChange={(themeSwitchEnabled) => patchHelpPage({ themeSwitchEnabled })}
          aria-label={t.enableThemeSwitch}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label={t.defaultTheme}>
        <ThemeSegment
          value={hp.defaultTheme}
          onChange={(defaultTheme) => patchHelpPage({ defaultTheme })}
          labels={{ light: t.light, dark: t.dark }}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label={t.lightPrimaryColor}>
        <ChatWidgetColorField
          value={hp.primaryColorLight}
          defaultValue={WIDGET_PRIMARY_COLOR_DEFAULT}
          onChange={(primaryColorLight) => patchHelpPage({ primaryColorLight })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label={t.darkPrimaryColor}>
        <ChatWidgetColorField
          value={hp.primaryColorDark}
          defaultValue={WIDGET_PRIMARY_COLOR_DEFAULT}
          onChange={(primaryColorDark) => patchHelpPage({ primaryColorDark })}
        />
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow
        label={t.enableVoiceToText}
        description={t.voiceToTextDescription}
        variant="row"
      >
        <Switch
          checked={hp.voiceToTextEnabled}
          onCheckedChange={(voiceToTextEnabled) => patchHelpPage({ voiceToTextEnabled })}
          aria-label={t.enableVoiceToText}
        />
      </ChatWidgetSettingRow>

      <UploadStubField
        label={t.logo}
        description={t.logoDescription}
        uploadLabel={t.upload}
      />

      <UploadStubField
        label={t.darkLogo}
        description={t.darkLogoDescription}
        uploadLabel={t.upload}
      />

      <UploadStubField
        label={t.heroImage}
        description={t.heroImageDescription}
        uploadLabel={t.upload}
      />

      <UploadStubField
        label={t.darkHeroImage}
        description={t.darkHeroImageDescription}
        uploadLabel={t.upload}
      />
    </div>
  );
}
