"use client";

import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
import { VocallyLogo } from "@/components/brand/VocallyLogo";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

type ChatFloatingProps = {
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
};

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

export function ChatFloating({
  agentId,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  initialMessages,
  initialSessionId,
}: ChatFloatingProps) {
  const [open, setOpen] = useState(false);
  const { isPlaying, play } = useAudioPlayer();

  const handleAudioReady = useCallback(
    (base64: string) => {
      play(base64);
    },
    [play],
  );

  const { messages, isLoading, isProcessingVoice, isVoiceSupported, error, sendMessage, sendVoiceMessage } =
    useChat({
      agentId,
      sessionId: initialSessionId,
      initialMessages,
      onAudioReady: handleAudioReady,
    });

  const { stream, isMicEnabled, requestMic, releaseMic } = useMicrophone();
  const { isRecording, audioBlob, durationMs, startRecording, stopRecording, clear } =
    useAudioRecorder(isMicEnabled ? stream : null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || isLoading || isProcessingVoice) return;
    sendMessage(input.value);
    input.value = "";
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] h-[520px] flex flex-col bg-surface-card border border-hairline rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-strong">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {agentName[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-ink truncate">
                  {agentName}
                </span>
                <span className="text-caption text-muted">
                  {isBusy ? "Processing..." : "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-hairline transition-colors"
              aria-label="Close chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!hasMessages && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-surface-strong text-body text-sm leading-relaxed">
                  <ChatMarkdown content={welcomeMessage} variant="assistant" />
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "USER"
                      ? "bg-primary text-white"
                      : "bg-surface-strong text-ink"
                  }`}
                >
                  <ChatMarkdown
                    content={msg.content}
                    variant={msg.role === "USER" ? "user" : "assistant"}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="flex justify-center">
                <span className="text-xs text-error bg-error/10 px-3 py-1 rounded-full">
                  {error}
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3 border-t border-hairline"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              disabled={isBusy || isRecording}
              className="flex-1 h-9 rounded-md border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary transition-colors disabled:opacity-50"
            />

            {isVoiceSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isBusy}
                title={isRecording ? "Stop recording" : "Start voice input"}
                className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-md border transition-colors ${
                  isRecording
                    ? "bg-error text-white border-error"
                    : "border-hairline text-muted hover:text-ink hover:bg-surface-strong"
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <span className="text-xs font-medium tabular-nums">
                    {formatDuration(durationMs)}
                  </span>
                ) : isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 2h3v12H3V2zm7 0h3v12h-3V2z" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 1a2 2 0 0 0-2 2v4a2 2 0 1 0 4 0V3a2 2 0 0 0-2-2z" />
                    <path d="M4 7a4 4 0 1 0 8 0" />
                    <path d="M8 11v3" />
                    <path d="M6 14h4" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary shrink-0 disabled:opacity-50"
            >
              {isBusy ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:0.2s]" />
                </span>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1.5 8l13-6-6 13-2-5-5-2z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        ) : (
          <VocallyLogo variant="white" size="md" className="size-7" />
        )}
      </button>
    </div>
  );
}
