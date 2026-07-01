"use client";

import { useState } from "react";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { ChatWidgetFloating } from "@/components/chat/ChatWidgetFloating";
import type {
  ResolvedCustomButtonAction,
  ResolvedSuggestedMessagesAction,
} from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import type { ChatWidgetDraft } from "./chat-widget-draft";

type PreviewViewport = "desktop" | "mobile";
type PreviewMode = "inline" | "floating";

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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("floating");
  const w = draft.widget;
  const displayName = w.displayName.trim() || agentName;
  const welcomeMessage =
    viewport === "mobile" && w.useMobileWelcome
      ? w.welcomeMessageMobile.trim() || draft.welcomeMessage
      : draft.welcomeMessage;

  const previewKey = `${previewMode}-${viewport}-${displayName}-${welcomeMessage}-${w.appearance}-${w.primaryColor}-${w.bubbleColor}`;

  const sharedChatProps = {
    agentId,
    widgetToken: widgetToken ?? undefined,
    agentName: displayName,
    welcomeMessage,
    appearance: w.appearance,
    primaryColor: w.primaryColor,
    placeholder: w.placeholder,
    suggestedMessagesAction,
    customButtonsAction,
    deployment: "widget" as const,
    voiceToTextEnabled: w.voiceToTextEnabled,
    showPoweredBy: true,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Preview</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
            {(["inline", "floating"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-caption transition-colors",
                  previewMode === mode
                    ? "bg-surface-card font-medium text-ink shadow-sm"
                    : "text-muted hover:text-ink",
                )}
              >
                {mode === "inline" ? "Inline" : "Floating bubble"}
              </button>
            ))}
          </div>
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
        <div
          className={cn(
            "relative flex min-h-0 flex-1 rounded-xl bg-canvas-soft/80",
            previewMode === "floating" ? "overflow-hidden p-0" : "items-center justify-center p-6",
          )}
        >
          {previewMode === "floating" ? (
            <ChatWidgetFloating
              key={previewKey}
              {...sharedChatProps}
              bubbleColor={w.bubbleColor}
              autoShowWelcomePopup={w.autoShowWelcomePopup}
              autoShowWelcomePopupMobile={w.autoShowWelcomePopupMobile}
              welcomePopupDelaySec={w.welcomePopupDelaySec}
              contained
              isMobile={viewport === "mobile"}
            />
          ) : (
            <ChatWidget
              key={previewKey}
              {...sharedChatProps}
              onClear
              className={cn(
                "h-full min-h-0 max-h-full shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]",
                viewport === "mobile" ? "w-full max-w-[320px]" : "w-full max-w-[380px]",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
