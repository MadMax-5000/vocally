"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useChat, type ChatMessage } from "@/hooks/useChat";

type ChatFloatingProps = {
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
};

export function ChatFloating({
  agentId,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  initialMessages,
  initialSessionId,
}: ChatFloatingProps) {
  const [open, setOpen] = useState(false);
  const { messages, isLoading, error, sendMessage } = useChat({
    agentId,
    sessionId: initialSessionId,
    initialMessages,
  });

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
    if (!input || !input.value.trim() || isLoading) return;
    sendMessage(input.value);
    input.value = "";
  };

  const hasMessages = messages.length > 0;

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
                  {isLoading ? "Typing..." : "Online"}
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
                <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-surface-strong text-body text-sm">
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
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2L2 8l5 1 1 5 6-12z" />
          </svg>
        )}
      </button>
    </div>
  );
}
