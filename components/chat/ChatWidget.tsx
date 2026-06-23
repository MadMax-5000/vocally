"use client";

import { useEffect, useRef, FormEvent, useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ChatCustomButtonsRow } from "@/components/chat/ChatCustomButtonsRow";
import { ChatInlineForm } from "@/components/chat/ChatInlineForm";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import {
  ChatMessageComposer,
  chatComposerFormatDuration,
} from "@/components/chat/ChatMessageComposer";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
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
  showPoweredBy?: boolean;
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  placeholder?: string;
  suggestedMessages?: string[];
  keepShowingSuggested?: boolean;
  suggestedMessagesAction?: ResolvedSuggestedMessagesAction;
  customButtonsAction?: ResolvedCustomButtonAction;
  deployment?: "widget" | "help";
  onSuggestedClick?: (message: string) => void;
  customButtonsReadOnly?: boolean;
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
  showPoweredBy = true,
  appearance = "light",
  primaryColor,
  placeholder = "Message...",
  suggestedMessages = [],
  keepShowingSuggested = false,
  suggestedMessagesAction,
  customButtonsAction,
  deployment = "widget",
  onSuggestedClick,
  customButtonsReadOnly,
}: ChatWidgetProps) {
  const actionEnabled = suggestedMessagesAction?.enabled ?? false;

  const initialSuggestedMessages = useMemo(() => {
    if (!actionEnabled || !suggestedMessagesAction) return [];
    return getInitialSuggestedMessages(suggestedMessagesAction, suggestedMessages);
  }, [actionEnabled, suggestedMessagesAction, suggestedMessages]);

  const { isPlaying, play } = useAudioPlayer();

  const handleAudioReady = useCallback(
    (base64: string) => {
      play(base64);
    },
    [play],
  );

  const {
    messages,
    suggestedMessages: liveSuggestedMessages,
    isEscalated,
    escalationMessage,
    isLoading,
    isProcessingVoice,
    isVoiceSupported,
    error,
    activeForm,
    formSubmitting,
    sendMessage,
    submitForm,
    sendVoiceMessage,
    clearMessages,
  } = useChat({
    agentId,
    widgetToken,
    sessionId: initialSessionId,
    initialMessages,
    initialSuggestedMessages: actionEnabled ? initialSuggestedMessages : undefined,
    onAudioReady: handleAudioReady,
    deployment,
  });

  const { stream, isMicEnabled, requestMic } = useMicrophone();
  const { isRecording, audioBlob, durationMs, startRecording, stopRecording, clear } =
    useAudioRecorder(isMicEnabled ? stream : null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const showClearButton = onClear !== undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isLoading || isProcessingVoice || isEscalated) return;
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

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (audioBlob) {
      clear();
    }

    if (!isMicEnabled) {
      await requestMic();
    }

    setTimeout(() => startRecording(), 100);
  };

  useEffect(() => {
    if (!audioBlob || isRecording) return;
    sendVoiceMessage(audioBlob);
  }, [audioBlob, isRecording, sendVoiceMessage]);

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isProcessingVoice;
  const canSend =
    draft.trim().length > 0 && !isBusy && !isRecording && !isEscalated;
  const isDark = appearance === "dark";

  const displaySuggestions = actionEnabled
    ? liveSuggestedMessages
    : suggestedMessages;

  const keepShowing = actionEnabled
    ? (suggestedMessagesAction?.keepShowingAfterFirst ?? false)
    : keepShowingSuggested;

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
        {showClearButton && (
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
                  <RefreshCw className="size-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Clear messages</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

        {error && (
          <div className="flex justify-center">
            <span className="rounded-full bg-error/10 px-3 py-1 text-xs text-error">
              {error}
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
          isBusy={isBusy || isRecording || isEscalated}
          canSend={canSend}
          showSuggestions={showSuggestionChips}
          suggestedMessages={displaySuggestions}
          onSuggestedClick={handleSuggestedClick}
          voice={
            isVoiceSupported
              ? {
                  show: true,
                  onClick: handleMicToggle,
                  isRecording,
                  recordingLabel: chatComposerFormatDuration(durationMs),
                  isPlaying,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
