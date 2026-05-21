"use client";

import { useEffect, useRef, FormEvent, useCallback, useState } from "react";
import { ArrowUp, Mic, RefreshCw } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
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

  return (
    <div
      className={cn(
        "flex h-full min-h-[500px] max-h-[min(650px,100%)] w-full flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-hairline-soft bg-canvas-soft/60 px-3.5">
        <h2 className="min-w-0 truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
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
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-card text-muted transition-colors hover:border-hairline-strong hover:bg-white hover:text-ink"
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
            <div className="max-w-[85%] rounded-xl bg-surface-strong px-3 py-2 text-sm leading-relaxed text-ink">
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
              <div className="max-w-[85%] rounded-md bg-primary px-3 py-1.5 text-sm leading-relaxed text-on-primary">
                <ChatMarkdown content={msg.content} variant="user" />
              </div>
            ) : (
              <div className="max-w-[85%] text-sm leading-relaxed text-ink">
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

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-card py-1 pl-3.5 pr-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message..."
              disabled={isBusy || isRecording}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted-soft outline-none disabled:opacity-50"
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
                  ? "bg-primary text-on-primary hover:bg-primary-active"
                  : "bg-surface-strong text-muted-soft",
              )}
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
