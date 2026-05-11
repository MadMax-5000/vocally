"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  role: "USER" | "BOT" | "AGENT" | "SYSTEM";
  content: string;
  createdAt: string;
};

export type UseChatOptions = {
  agentId: string;
  sessionId?: string | null;
  initialMessages?: ChatMessage[];
};

export function useChat({ agentId, sessionId: initialSessionId, initialMessages }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `sessionId=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const msg: ChatMessage = {
            id: row.id as string,
            role: row.role as ChatMessage["role"],
            content: row.content as string,
            createdAt: (row.created_at as string) ?? new Date().toISOString(),
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      const trimmed = content.trim();
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "USER",
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            sessionId: sessionIdRef.current,
            message: trimmed,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error ?? "Failed to send message");
        }

        if (json.data.sessionId && !sessionIdRef.current) {
          setSessionId(json.data.sessionId);
        }

        const userId = json.data.userMessage.id;
        const botId = json.data.message.id;
        setMessages((prev) => {
          const withRealUser = prev.map((m) =>
            m.id === tempId
              ? { ...m, id: userId, createdAt: json.data.userMessage.createdAt }
              : m,
          );
          if (withRealUser.some((m) => m.id === botId)) return withRealUser;
          return [
            ...withRealUser,
            {
              id: botId,
              role: "BOT" as const,
              content: json.data.message.content,
              createdAt: json.data.message.createdAt,
            },
          ];
        });
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, isLoading],
  );

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
  };
}
