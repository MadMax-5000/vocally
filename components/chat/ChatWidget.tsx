"use client";

import { useEffect, useRef, FormEvent, useCallback, useState } from "react";
import { ArrowUp, Mic, RefreshCw } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { WebChatWidgetAppearance } from "@/lib/deploy/web-chat-config";
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
  onSuggestedClick?: (message: string) => void;
};

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

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
  onSuggestedClick,
}: ChatWidgetProps) {
  const { isPlaying, play } = useAudioPlayer();

  const handleAudioReady = useCallback(
    (base64: string) => {
      play(base64);
    },
    [play],
  );

  const {
    messages,
    isLoading,
    isProcessingVoice,
    isVoiceSupported,
    error,
    sendMessage,
    sendVoiceMessage,
    clearMessages,
  } = useChat({
    agentId,
    widgetToken,
    sessionId: initialSessionId,
    initialMessages,
    onAudioReady: handleAudioReady,
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
    if (!text || isLoading || isProcessingVoice) return;
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
  const canSend = draft.trim().length > 0 && !isBusy && !isRecording;
  const isDark = appearance === "dark";
  const visibleSuggestions = suggestedMessages.filter((s) => s.trim());

  const widgetStyle = primaryColor
    ? ({ "--widget-primary": primaryColor } as React.CSSProperties)
    : undefined;

  function handleSuggestedClick(text: string) {
    if (onSuggestedClick) {
      onSuggestedClick(text);
      return;
    }
    if (!isBusy && !isRecording) {
      sendMessage(text);
    }
  }

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
        {showPoweredBy && <PoweredByVocally />}

        {visibleSuggestions.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {visibleSuggestions.map((text, i) => (
              <button
                key={`${text}-${i}`}
                type="button"
                onClick={() => handleSuggestedClick(text)}
                disabled={isBusy || isRecording}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50",
                  isDark
                    ? "border-hairline-strong text-[#fafaf9] hover:bg-[#292524]"
                    : "border-hairline text-ink hover:bg-surface-strong",
                )}
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full border py-1 pl-3.5 pr-1.5",
              isDark
                ? "border-hairline-strong bg-[#292524]"
                : "border-hairline bg-surface-card",
            )}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              disabled={isBusy || isRecording}
              className={cn(
                "min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-50",
                isDark
                  ? "text-[#fafaf9] placeholder:text-[#a8a29e]"
                  : "text-ink placeholder:text-muted-soft",
              )}
            />

            {isVoiceSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isBusy}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  isRecording
                    ? "bg-error text-white"
                    : "text-muted hover:text-ink disabled:opacity-50",
                )}
              >
                {isRecording ? (
                  <span className="text-[10px] font-medium tabular-nums">
                    {formatDuration(durationMs)}
                  </span>
                ) : isPlaying ? (
                  <span className="text-[10px] font-medium">▮▮</span>
                ) : (
                  <Mic className="size-4" strokeWidth={1.75} />
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                canSend
                  ? primaryColor
                    ? "text-white"
                    : "bg-primary text-on-primary hover:bg-primary-active"
                  : isDark
                    ? "bg-[#44403c] text-[#a8a29e]"
                    : "bg-surface-strong text-muted-soft",
              )}
              style={
                canSend && primaryColor
                  ? { backgroundColor: "var(--widget-primary)" }
                  : undefined
              }
            >
              {isBusy ? (
                <span className="flex items-center gap-0.5">
                  <span className="size-1 animate-bounce rounded-full bg-current opacity-70" />
                  <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.1s]" />
                  <span className="size-1 animate-bounce rounded-full bg-current opacity-70 [animation-delay:0.2s]" />
                </span>
              ) : (
                <ArrowUp className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
