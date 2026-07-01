"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ChevronDown, RefreshCwIcon } from "@/lib/icons/app-icons"

import { useEffect, useRef, FormEvent, useMemo, useState } from "react";
import { ChatCustomButtonsRow } from "@/components/chat/ChatCustomButtonsRow";
import { ChatInlineForm } from "@/components/chat/ChatInlineForm";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import {
  ChatMessageComposer,
  chatComposerFormatDuration,
} from "@/components/chat/ChatMessageComposer";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { getVisibleCustomButtons } from "@/lib/deploy/custom-button-action";
import type {
  ResolvedCustomButtonAction,
  ResolvedSuggestedMessagesAction,
  WebChatWidgetAppearance,
} from "@/lib/deploy/web-chat-config";
import {
  getInitialSuggestedMessages,
  shouldShowSuggestedMessages,
} from "@/lib/deploy/suggested-messages-action";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChatWidgetProps = {
  agentId: string;
  widgetToken?: string;
  agentName?: string;
  welcomeMessage?: string;
  className?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
  /** Pass `true` or a handler to show the refresh control (dashboard preview). */
  onClear?: boolean | (() => void);
  /** When provided, shows a minimize control in the header (floating bubble). */
  onMinimize?: () => void;
  showPoweredBy?: boolean;
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  placeholder?: string;
  suggestedMessagesAction?: ResolvedSuggestedMessagesAction;
  customButtonsAction?: ResolvedCustomButtonAction;
  deployment?: "widget" | "help";
  onSuggestedClick?: (message: string) => void;
  customButtonsReadOnly?: boolean;
  voiceToTextEnabled?: boolean;
};

export function ChatWidget({
  agentId,
  widgetToken,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  className = "",
  initialMessages,
  initialSessionId,
  onClear,
  onMinimize,
  showPoweredBy = true,
  appearance = "light",
  primaryColor,
  placeholder = "Message...",
  suggestedMessagesAction,
  customButtonsAction,
  deployment = "widget",
  onSuggestedClick,
  customButtonsReadOnly,
  voiceToTextEnabled = false,
}: ChatWidgetProps) {
  const actionEnabled = suggestedMessagesAction?.enabled ?? false;

  const initialSuggestedMessages = useMemo(() => {
    if (!actionEnabled || !suggestedMessagesAction) return [];
    return getInitialSuggestedMessages(suggestedMessagesAction);
  }, [actionEnabled, suggestedMessagesAction]);

  const {
    messages,
    suggestedMessages: liveSuggestedMessages,
    isEscalated,
    escalationMessage,
    isLoading,
    error,
    activeForm,
    formSubmitting,
    sendMessage,
    submitForm,
    clearMessages,
  } = useChat({
    agentId,
    widgetToken,
    sessionId: initialSessionId,
    initialMessages,
    initialSuggestedMessages: actionEnabled ? initialSuggestedMessages : undefined,
    deployment,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const {
    isMicSupported,
    isRecording,
    isTranscribing,
    durationMs,
    handleMicToggle,
    cancelRecording,
  } = useVoiceToText({
    agentId,
    widgetToken,
    deployment,
    enabled: voiceToTextEnabled,
    onTranscript: (text) => {
      setDraft(text);
      setVoiceError(null);
    },
    onError: (message) => setVoiceError(message),
  });

  const showClearButton = onClear !== undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isLoading || isTranscribing || isEscalated) return;
    sendMessage(text);
    setDraft("");
  };

  const handleClear = () => {
    if (typeof onClear === "function") {
      onClear();
    } else {
      clearMessages();
    }
  };

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isTranscribing;
  const canSend =
    draft.trim().length > 0 && !isBusy && !isRecording && !isEscalated;
  const isDark = appearance === "dark";

  const voiceProps =
    voiceToTextEnabled && isMicSupported
      ? {
          show: true as const,
          onClick: handleMicToggle,
          onCancel: cancelRecording,
          isRecording,
          isTranscribing,
          recordingLabel: chatComposerFormatDuration(durationMs),
        }
      : undefined;

  const displaySuggestions = actionEnabled ? liveSuggestedMessages : [];

  const keepShowing = suggestedMessagesAction?.keepShowingAfterFirst ?? false;

  const visibleSuggestions = displaySuggestions.filter((s) => s.trim());
  const showSuggestionChips =
    !isEscalated &&
    shouldShowSuggestedMessages({
      hasMessages,
      keepShowingAfterFirst: keepShowing,
      suggestionCount: visibleSuggestions.length,
    });

  const widgetStyle = primaryColor
    ? ({ "--widget-primary": primaryColor } as React.CSSProperties)
    : undefined;

  function handleSuggestedClick(text: string) {
    if (onSuggestedClick) {
      onSuggestedClick(text);
      return;
    }
    if (!isBusy && !isRecording && !isEscalated) {
      sendMessage(text);
    }
  }

  const visibleCustomButtons = useMemo(
    () =>
      customButtonsAction ? getVisibleCustomButtons(customButtonsAction) : [],
    [customButtonsAction],
  );

  function handleCustomButtonMessage(text: string) {
    if (!isBusy && !isRecording && !isEscalated) {
      sendMessage(text);
    }
  }

  const handoffBannerText =
    escalationMessage ?? "Connecting you to an agent. Please wait.";

  return (
    <div
      data-widget-appearance={appearance}
      style={widgetStyle}
      className={cn(
        "flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.1)]",
        isDark
          ? "border-hairline-strong bg-[#1c1917] text-[#fafaf9]"
          : "border-hairline bg-surface-card",
        className,
      )}
    >
      <header
        className={cn(
          "flex h-11 shrink-0 items-center justify-between gap-3 border-b px-3.5",
          isDark
            ? "border-hairline-strong bg-[#292524]/80"
            : "border-hairline-soft bg-canvas-soft/60",
        )}
      >
        <h2
          className={cn(
            "min-w-0 truncate text-[15px] font-medium tracking-[-0.01em]",
            isDark ? "text-[#fafaf9]" : "text-ink",
          )}
        >
          {agentName}
        </h2>
        {(showClearButton || onMinimize) && (
          <div className="flex shrink-0 items-center gap-1">
            {onMinimize ? (
              <button
                type="button"
                onClick={onMinimize}
                aria-label="Minimize chat"
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border transition-colors",
                  isDark
                    ? "border-hairline-strong bg-[#292524] text-muted hover:text-[#fafaf9]"
                    : "border-hairline bg-surface-card text-muted hover:border-hairline-strong hover:bg-white hover:text-ink",
                )}
              >
                <AppIcon icon={ChevronDown} className="size-4" strokeWidth={2} />
              </button>
            ) : null}
            {showClearButton ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleClear}
                      aria-label="Clear messages"
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isDark
                          ? "border-hairline-strong bg-[#292524] text-muted hover:text-[#fafaf9]"
                          : "border-hairline bg-surface-card text-muted hover:border-hairline-strong hover:bg-white hover:text-ink",
                      )}
                    >
                      <AppIcon icon={RefreshCwIcon} className="size-3.5" strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Clear messages</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2.5">
        {!hasMessages && (
          <div className="flex justify-start">
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                isDark ? "bg-[#292524] text-[#fafaf9]" : "bg-surface-strong text-ink",
              )}
            >
              <ChatMarkdown content={welcomeMessage} variant="assistant" />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "USER" ? "justify-end" : "justify-start")}
          >
            {msg.role === "USER" ? (
              <div
                className={cn(
                  "max-w-[85%] rounded-md px-3 py-1.5 text-sm leading-relaxed",
                  primaryColor ? "text-white" : "bg-primary text-on-primary",
                )}
                style={
                  primaryColor
                    ? { backgroundColor: "var(--widget-primary)" }
                    : undefined
                }
              >
                <ChatMarkdown content={msg.content} variant="user" />
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[85%] text-sm leading-relaxed",
                  isDark ? "text-[#fafaf9]" : "text-ink",
                )}
              >
                <ChatMarkdown content={msg.content} variant="assistant" />
              </div>
            )}
          </div>
        ))}

        {isBusy && hasMessages && (
          <div className="flex justify-start">
            <span className="flex items-center gap-1 py-1">
              <span className="size-1.5 animate-bounce rounded-full bg-muted" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0.2s]" />
            </span>
          </div>
        )}

        {(error || voiceError) && (
          <div className="flex justify-center">
            <span className="rounded-full bg-error/10 px-3 py-1 text-xs text-error">
              {error ?? voiceError}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-3.5 pb-2 pt-0.5">
        {isEscalated ? (
          <div
            className={cn(
              "mb-2 rounded-lg border px-3 py-2 text-body-sm leading-relaxed",
              isDark
                ? "border-hairline-strong bg-[#292524] text-[#fafaf9]"
                : "border-hairline bg-surface-strong text-ink",
            )}
            role="status"
          >
            {handoffBannerText}
          </div>
        ) : null}

        {showPoweredBy && <PoweredByVocally />}

        <ChatCustomButtonsRow
          buttons={visibleCustomButtons}
          appearance={appearance}
          isBusy={isBusy || isRecording || isEscalated}
          readOnly={customButtonsReadOnly || isEscalated}
          onMessageClick={handleCustomButtonMessage}
        />

        {activeForm && !isEscalated ? (
          <div className="mb-2">
            <ChatInlineForm
              form={activeForm}
              disabled={isBusy || isRecording || formSubmitting}
              onSubmit={submitForm}
            />
          </div>
        ) : null}

        <ChatMessageComposer
          appearance={appearance}
          primaryColor={primaryColor}
          placeholder={isEscalated ? "Waiting for an agent…" : placeholder}
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          isBusy={isBusy || isEscalated}
          canSend={canSend}
          showSuggestions={showSuggestionChips}
          suggestedMessages={displaySuggestions}
          onSuggestedClick={handleSuggestedClick}
          voice={voiceProps}
        />
      </div>
    </div>
  );
}
