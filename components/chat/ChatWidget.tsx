"use client";

import { useEffect, useRef, FormEvent } from "react";
import { useChat, type ChatMessage } from "@/hooks/useChat";

type ChatWidgetProps = {
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  className?: string;
  initialMessages?: ChatMessage[];
  initialSessionId?: string;
};

export function ChatWidget({
  agentId,
  agentName = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  className = "",
  initialMessages,
  initialSessionId,
}: ChatWidgetProps) {
  const { messages, isLoading, error, sendMessage } = useChat({
    agentId,
    sessionId: initialSessionId,
    initialMessages,
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
            {isLoading ? "Typing..." : "Online"}
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
  );
}
