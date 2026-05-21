"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  role: "USER" | "BOT" | "AGENT" | "SYSTEM";
  content: string;
  createdAt: string;
};

export type ChatDeployment = "widget" | "help";

export type UseChatOptions = {
  agentId: string;
  widgetToken?: string;
  sessionId?: string | null;
  initialMessages?: ChatMessage[];
  onAudioReady?: (base64: string) => void;
  deployment?: ChatDeployment;
};

function getVoiceSupportedSnapshot(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useChat({
  agentId,
  widgetToken,
  sessionId: initialSessionId,
  initialMessages,
  onAudioReady,
  deployment = "widget",
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const isVoiceSupported = useSyncExternalStore(
    () => () => {},
    getVoiceSupportedSnapshot,
    () => false,
  );

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
          const rawCreated =
            row.createdAt ?? row.created_at ?? row["createdAt"];
          const msg: ChatMessage = {
            id: row.id as string,
            role: row.role as ChatMessage["role"],
            content: row.content as string,
            createdAt:
              typeof rawCreated === "string"
                ? rawCreated
                : rawCreated instanceof Date
                  ? rawCreated.toISOString()
                  : new Date().toISOString(),
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

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
            ...(widgetToken ? { widgetToken } : {}),
            sessionId: sessionIdRef.current,
            message: trimmed,
            ...(deployment === "help" ? { deployment: "help" as const } : {}),
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
    [agentId, widgetToken, isLoading, deployment],
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (isProcessingVoice) return;

      setIsProcessingVoice(true);
      setError(null);

      const tempId = `voice-temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "USER",
          content: "🎤 Recording...",
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const base64 = await blobToBase64(audioBlob);
        const format = audioBlob.type || "audio/webm";

        const res = await fetch("/api/voice/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            sessionId: sessionIdRef.current,
            audio: base64,
            format,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error ?? "Voice processing failed");
        }

        const d = json.data;

        if (d.sessionId && !sessionIdRef.current) {
          setSessionId(d.sessionId);
        }

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          const updated = [
            ...withoutTemp,
            {
              id: d.messages.user.id,
              role: "USER" as const,
              content: d.transcript,
              createdAt: d.messages.user.createdAt,
            },
            {
              id: d.messages.bot.id,
              role: "BOT" as const,
              content: d.botContent,
              createdAt: d.messages.bot.createdAt,
            },
          ];
          return updated;
        });

        if (d.audioBase64 && onAudioReady) {
          onAudioReady(d.audioBase64);
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err instanceof Error ? err.message : "Voice processing failed");
      } finally {
        setIsProcessingVoice(false);
      }
    },
    [agentId, isProcessingVoice, onAudioReady],
  );

  return {
    messages,
    sessionId,
    isLoading,
    isProcessingVoice,
    isVoiceSupported,
    error,
    sendMessage,
    sendVoiceMessage,
    clearMessages,
  };
}
