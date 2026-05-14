"use client";

import { useEffect, useRef, FormEvent, useCallback } from "react";
import { Eraser } from "lucide-react";

import { useChat } from "@/hooks/useChat";
import { useMicrophone } from "@/hooks/useMicrophone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AVATAR_DATA, AnimatedAvatar } from "@/utils/lib/avatars";
import { Button } from "@/components/ui/button";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

function resolveAvatar(voiceId: string) {
  const direct = AVATAR_DATA.find((a) => a.id === voiceId);
  if (direct) return direct;
  if (AVATAR_DATA.length === 0) return undefined;
  let hash = 0;
  for (let i = 0; i < voiceId.length; i++) {
    hash = (hash * 31 + voiceId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_DATA[hash % AVATAR_DATA.length];
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

export function AgentDetailPreviewTab({ agent }: Props) {
  const primaryVoice = agent.voices.find((v) => v.isPrimary) ?? agent.voices[0];
  const voiceId = primaryVoice?.voiceId ?? AVATAR_DATA[0]?.id ?? "omar";
  const avatar = resolveAvatar(voiceId);

  const { isPlaying, play } = useAudioPlayer();

  const handleAudioReady = useCallback(
    (base64: string) => {
      play(base64);
    },
    [play],
  );

  const { messages, isLoading, isProcessingVoice, isVoiceSupported, error, sendMessage, sendVoiceMessage, clearMessages } =
    useChat({
      agentId: agent.id,
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
  const typingLabel = isProcessingVoice ? "Processing..." : isLoading ? "Typing..." : "Online";

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-2 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatar && <AnimatedAvatar avatar={avatar} size={32} />}
          <div>
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              {agent.name}
            </h1>
            <p className="text-caption text-muted">Preview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-hairline bg-surface-card px-3 text-body-sm font-medium text-body shadow-none hover:bg-canvas-soft"
            disabled={!hasMessages}
            onClick={clearMessages}
          >
            <Eraser className="mr-1.5 h-4 w-4 text-muted" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-hairline bg-surface-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline bg-surface-strong">
          {avatar && <AnimatedAvatar avatar={avatar} size={24} />}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-ink truncate">
              {agent.name}
            </span>
            <span className="text-caption text-muted">{typingLabel}</span>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-3 min-h-[320px] max-h-[500px]">
          {!hasMessages && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl px-4 py-2.5 bg-surface-strong text-body text-sm leading-relaxed">
                {agent.welcomeMessage ||
                  "Hello! How can I help you today?"}
              </div>
            </div>
          )}

          {messages.map((msg) =>
            msg.role === "USER" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-xl px-4 py-2.5 bg-primary text-white text-sm leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-start gap-2">
                {avatar && (
                  <div className="mt-1 shrink-0">
                    <AnimatedAvatar avatar={avatar} size={20} />
                  </div>
                )}
                <div className="max-w-[75%] rounded-xl px-4 py-2.5 bg-surface-strong text-ink text-sm leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ),
          )}

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
            {isLoading ? (
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
    </div>
  );
}
