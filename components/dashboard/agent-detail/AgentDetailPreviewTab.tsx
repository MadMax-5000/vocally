"use client";

import { useEffect, useRef, FormEvent } from "react";
import { Eraser } from "lucide-react";

import { useChat } from "@/hooks/useChat";
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

export function AgentDetailPreviewTab({ agent }: Props) {
  const primaryVoice = agent.voices.find((v) => v.isPrimary) ?? agent.voices[0];
  const voiceId = primaryVoice?.voiceId ?? AVATAR_DATA[0]?.id ?? "omar";
  const avatar = resolveAvatar(voiceId);

  const { messages, isLoading, error, sendMessage } = useChat({
    agentId: agent.id,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || isLoading) return;
    sendMessage(input.value);
    input.value = "";
  };

  const hasMessages = messages.length > 0;
  const typingLabel = isLoading ? "Typing..." : "Online";

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
            onClick={() => {
              inputRef.current?.focus();
            }}
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
            disabled={isLoading}
            className="flex-1 h-9 rounded-md border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
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
