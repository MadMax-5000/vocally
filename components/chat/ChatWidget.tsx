"use client";

import { useEffect, useRef, FormEvent, useCallback } from "react";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

type ChatWidgetProps = {
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  className?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
};

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

export function ChatWidget({
  agentId,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  className = "",
  initialMessages,
  initialSessionId,
}: ChatWidgetProps) {
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div
      className={`flex flex-col bg-surface-card border border-hairline rounded-xl overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline bg-surface-strong">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 max-h-[500px]">
        {!hasMessages && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl px-4 py-2.5 bg-surface-strong text-body text-sm">
              {welcomeMessage}
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
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "USER"
                  ? "bg-primary text-white"
                  : "bg-surface-strong text-ink"
              }`}
            >
              {msg.content}
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
              <span className="flex items-center gap-1">
                <span className="text-xs font-medium tabular-nums">
                  {formatDuration(durationMs)}
                </span>
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
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}
