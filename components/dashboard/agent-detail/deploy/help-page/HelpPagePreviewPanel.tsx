"use client";

import { useEffect, useMemo, useState } from "react";

import { HelpPagePreviewFrame } from "@/components/chat/HelpPagePreviewFrame";
import { getInitialSuggestedMessages } from "@/lib/deploy/suggested-messages-action";
import type { ResolvedSuggestedMessagesAction } from "@/lib/deploy/web-chat-config";
import type { WebChatHelpPageTheme } from "@/lib/deploy/web-chat-config";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

import type { HelpPageDraft } from "./help-page-draft";

type HelpPagePreviewPanelProps = {
  draft: HelpPageDraft;
  agentName: string;
  suggestedMessagesAction: ResolvedSuggestedMessagesAction;
};

export function HelpPagePreviewPanel({
  draft,
  agentName,
  suggestedMessagesAction,
}: HelpPagePreviewPanelProps) {
  const t = useDeploySitesMessages().helpPage;
  const hp = draft.helpPage;
  const [previewTheme, setPreviewTheme] = useState<WebChatHelpPageTheme>(hp.defaultTheme);

  useEffect(() => {
    setPreviewTheme(hp.defaultTheme);
  }, [hp.defaultTheme]);

  const activeTheme = hp.themeSwitchEnabled ? previewTheme : hp.defaultTheme;

  const { logoUrl, heroUrl, primaryColor } = useMemo(() => {
    const isDark = activeTheme === "dark";
    return {
      logoUrl: isDark ? hp.logoDarkUrl || hp.logoUrl : hp.logoUrl || hp.logoDarkUrl,
      heroUrl: isDark ? hp.heroDarkUrl || hp.heroUrl : hp.heroUrl || hp.heroDarkUrl,
      primaryColor: isDark ? hp.primaryColorDark : hp.primaryColorLight,
    };
  }, [activeTheme, hp]);

  const previewSuggestions = useMemo(
    () => getInitialSuggestedMessages(suggestedMessagesAction),
    [suggestedMessagesAction],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">{t.preview}</h3>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-8">
        <div className="flex h-full max-h-[min(720px,100%)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas-soft shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline-soft bg-canvas-soft/80 px-4">
            <span className="size-3 shrink-0 rounded-full bg-[#ff5f57]" />
            <span className="size-3 shrink-0 rounded-full bg-[#febc2e]" />
            <span className="size-3 shrink-0 rounded-full bg-[#28c840]" />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <HelpPagePreviewFrame
              sidebarLabel={agentName}
              headline={hp.headline}
              theme={activeTheme}
              primaryColor={primaryColor}
              logoUrl={logoUrl || undefined}
              heroUrl={heroUrl || undefined}
              placeholder={hp.placeholder}
              voiceToTextEnabled={hp.voiceToTextEnabled}
              themeSwitchEnabled={hp.themeSwitchEnabled}
              suggestedMessages={previewSuggestions}
              showSuggestions={suggestedMessagesAction.enabled}
              navLinks={hp.navLinks}
              onThemeChange={hp.themeSwitchEnabled ? setPreviewTheme : undefined}
              staticPreview
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
