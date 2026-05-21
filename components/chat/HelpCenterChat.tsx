"use client";

import { useEffect, useRef, FormEvent, useState } from "react";
import { ArrowUp } from "lucide-react";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { PoweredByVocally } from "@/components/chat/PoweredByVocally";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

type HelpCenterChatProps = {
  agentId: string;
  widgetToken?: string;
  agentName?: string;
  welcomeMessage?: string;
  className?: string;
};

export function HelpCenterChat({
  agentId,
  widgetToken,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  className = "",
}: HelpCenterChatProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChat({
    agentId,
    widgetToken,
    deployment: "help",
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const hasMessages = messages.length > 0;
  const isBusy = isLoading;
  const canSend = draft.trim().length > 0 && !isBusy;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    sendMessage(text);
    setDraft("");
  };

  const inputBar = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-card px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question..."
          disabled={isBusy}
          className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted-soft outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            canSend
              ? "bg-ink text-on-primary hover:bg-body-strong"
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
  );

  return (
    <div
      className={cn(
        "flex min-h-dvh w-full flex-col bg-canvas",
        className,
      )}
    >
      {!hasMessages ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-16">
          <div className="w-full max-w-3xl text-center">
            <h1 className="font-display text-display-md tracking-tight text-ink text-balance">
              How can we help you today?
            </h1>
            <p className="mt-3 text-body-sm text-muted">
              Ask anything about {agentName}. Answers are powered by AI.
            </p>
            <div className="mt-8">{inputBar}</div>
            {!hasMessages && welcomeMessage ? (
              <p className="mt-6 text-caption text-muted-soft">{welcomeMessage}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <header className="shrink-0 border-b border-hairline-soft bg-surface-card px-4 py-3">
            <h1 className="font-display text-title-md text-ink">{agentName}</h1>
          </header>

          <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 space-y-4 overflow-y-auto px-4 py-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "USER" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "USER" ? (
                  <div className="max-w-[85%] rounded-xl bg-ink px-4 py-2.5 text-sm leading-relaxed text-on-primary">
                    <ChatMarkdown content={msg.content} variant="user" />
                  </div>
                ) : (
                  <div className="max-w-[90%] text-sm leading-relaxed text-ink">
                    <ChatMarkdown content={msg.content} variant="assistant" />
                  </div>
                )}
              </div>
            ))}

            {isBusy && (
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

          <div className="shrink-0 border-t border-hairline-soft bg-canvas px-4 py-4">
            <div className="mx-auto w-full max-w-3xl">
              {inputBar}
              <div className="mt-3">
                <PoweredByVocally />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
