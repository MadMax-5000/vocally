"use client";

import { useMemo } from "react";

import { ChatWidget } from "@/components/chat/ChatWidget";
import type {
  ResolvedCustomButtonAction,
  ResolvedSuggestedMessagesAction,
} from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import { ChatWidgetLauncherPreview } from "./ChatWidgetLauncherPreview";
import type { ChatWidgetDraft } from "./chat-widget-draft";

type PreviewViewport = "desktop" | "mobile";

type ChatWidgetPreviewPanelProps = {
  agentId: string;
  widgetToken?: string | null;
  agentName: string;
  draft: ChatWidgetDraft;
  suggestedMessagesAction?: ResolvedSuggestedMessagesAction;
  customButtonsAction?: ResolvedCustomButtonAction;
  viewport: PreviewViewport;
  onViewportChange: (v: PreviewViewport) => void;
};

export function ChatWidgetPreviewPanel({
  agentId,
  widgetToken,
  agentName,
  draft,
  suggestedMessagesAction,
  customButtonsAction,
  viewport,
  onViewportChange,
}: ChatWidgetPreviewPanelProps) {
  const w = draft.widget;
  const displayName = w.displayName.trim() || agentName;
  const welcomeMessage =
    viewport === "mobile" && w.useMobileWelcome
      ? w.welcomeMessageMobile.trim() || draft.welcomeMessage
      : draft.welcomeMessage;

  const showPopup = useMemo(() => {
    if (viewport === "mobile") return w.autoShowWelcomePopupMobile;
    return w.autoShowWelcomePopup;
  }, [viewport, w.autoShowWelcomePopup, w.autoShowWelcomePopupMobile]);

  const suggestedMessages = w.suggestedMessages.filter((s) => s.trim());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Preview</h3>
        <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
          {(["desktop", "mobile"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewportChange(v)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption capitalize transition-colors",
                viewport === v
                  ? "bg-surface-card font-medium text-ink shadow-sm"
                  : "text-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        {(w.autoShowWelcomePopup || w.autoShowWelcomePopupMobile) ? (
          <div className="shrink-0">
            <p className="mb-2 text-caption text-muted">Launcher & pop-up</p>
            <ChatWidgetLauncherPreview
              bubbleColor={w.bubbleColor}
              welcomeMessage={welcomeMessage}
              showPopup={showPopup}
            />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80 p-6">
          <ChatWidget
            key={`${viewport}-${displayName}-${welcomeMessage}-${w.appearance}-${w.primaryColor}`}
            agentId={agentId}
            widgetToken={widgetToken ?? undefined}
            agentName={displayName}
            welcomeMessage={welcomeMessage}
            appearance={w.appearance}
            primaryColor={w.primaryColor}
            placeholder={w.placeholder}
            suggestedMessages={suggestedMessages}
            keepShowingSuggested={w.keepShowingSuggested}
            suggestedMessagesAction={suggestedMessagesAction}
            customButtonsAction={customButtonsAction}
            deployment="widget"
            onClear
            showPoweredBy
            className={cn(
              "h-full min-h-0 max-h-full shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]",
              viewport === "mobile" ? "w-full max-w-[320px]" : "w-full max-w-[380px]",
            )}
          />
        </div>
      </div>
    </div>
  );
}
