"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import type { ChatFormUi } from "@/lib/chat/form-ui";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type ChatSessionStatus =
  | "ACTIVE"
  | "WAITING"
  | "BOT"
  | "HUMAN"
  | "ESCALATED"
  | "CLAIMED"
  | "RESOLVED"
  | "ABANDONED";

export type ChatMessage = {
  id: string;
  role: "USER" | "BOT" | "AGENT" | "SYSTEM";
  content: string;
  createdAt: string;
  ui?: ChatFormUi;
};

export type ChatDeployment = "widget" | "help";

export type UseChatOptions = {
  agentId: string;
  widgetToken?: string;
  sessionId?: string | null;
  initialMessages?: ChatMessage[];
  initialSuggestedMessages?: string[];
  onAudioReady?: (base64: string) => void;
  deployment?: ChatDeployment;
  context?: string;
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

const EMPTY_SUGGESTED_MESSAGES: string[] = [];

export function useChat({
  agentId,
  widgetToken,
  sessionId: initialSessionId,
  initialMessages,
  initialSuggestedMessages,
  onAudioReady,
  deployment = "widget",
  context,
}: UseChatOptions) {
  const resolvedInitialSuggested =
    initialSuggestedMessages ?? EMPTY_SUGGESTED_MESSAGES;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSuggestedRef = useRef(resolvedInitialSuggested);
  initialSuggestedRef.current = resolvedInitialSuggested;

  const [suggestedMessages, setSuggestedMessages] = useState<string[]>(
    () => resolvedInitialSuggested,
  );
  const [sessionStatus, setSessionStatus] = useState<ChatSessionStatus | null>(
    null,
  );
  const [escalationMessage, setEscalationMessage] = useState<string | null>(
    null,
  );
  /** Ephemeral: not persisted on Message rows; cleared on full page reload. */
  const [activeForm, setActiveForm] = useState<ChatFormUi | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    setSuggestedMessages(resolvedInitialSuggested);
  }, [resolvedInitialSuggested]);

  const isEscalated =
    sessionStatus === "ESCALATED" ||
    sessionStatus === "CLAIMED" ||
    escalationMessage !== null;

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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Session",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const status = row.status;
          if (typeof status === "string") {
            setSessionStatus(status as ChatSessionStatus);
          }
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
    setSessionStatus(null);
    setEscalationMessage(null);
    setSuggestedMessages(initialSuggestedRef.current);
    setActiveForm(null);
    setFormSubmitted(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || isEscalated) return;

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
            ...(context ? { context } : {}),
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error ?? "Failed to send message");
        }

        if (json.data.sessionId && !sessionIdRef.current) {
          setSessionId(json.data.sessionId);
        }

        if (json.data.suggestedMessages !== undefined) {
          setSuggestedMessages(json.data.suggestedMessages);
        }

        if (json.data.sessionStatus) {
          setSessionStatus(json.data.sessionStatus);
        }

        if (json.data.escalation?.escalated) {
          setEscalationMessage(json.data.escalation.message);
          setSessionStatus("ESCALATED");
          setSuggestedMessages([]);
        }

        const userId = json.data.userMessage.id;
        const botId = json.data.message.id;
        const formUi =
          json.data.ui ?? json.data.message?.ui ?? null;
        if (formUi?.type === "form" && !formSubmitted) {
          setActiveForm(formUi);
        }

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
              ...(formUi ? { ui: formUi } : {}),
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
    [agentId, widgetToken, isLoading, isEscalated, deployment, formSubmitted, context],
  );

  const submitForm = useCallback(
    async (values: Record<string, string>) => {
      if (!activeForm || formSubmitting || formSubmitted || isEscalated) {
        return;
      }
      if (!sessionIdRef.current) {
        setError("Start a conversation before submitting the form");
        return;
      }

      setFormSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/chat/form-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            ...(widgetToken ? { widgetToken } : {}),
            sessionId: sessionIdRef.current,
            formId: activeForm.formId,
            values,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error ?? "Failed to submit form");
        }

        setActiveForm(null);
        setFormSubmitted(true);

        if (json.data.sessionStatus) {
          setSessionStatus(json.data.sessionStatus);
        }

        setMessages((prev) => {
          let next = [...prev];
          if (json.data.systemMessage) {
            const sys = json.data.systemMessage;
            if (!next.some((m) => m.id === sys.id)) {
              next = [
                ...next,
                {
                  id: sys.id,
                  role: "SYSTEM" as const,
                  content: sys.content,
                  createdAt: sys.createdAt,
                },
              ];
            }
          }
          const user = json.data.userMessage;
          if (!next.some((m) => m.id === user.id)) {
            next = [
              ...next,
              {
                id: user.id,
                role: "USER" as const,
                content: user.content,
                createdAt: user.createdAt,
              },
            ];
          }
          const bot = json.data.message;
          if (!next.some((m) => m.id === bot.id)) {
            next = [
              ...next,
              {
                id: bot.id,
                role: "BOT" as const,
                content: bot.content,
                createdAt: bot.createdAt,
                ...(bot.ui ? { ui: bot.ui } : {}),
              },
            ];
          }
          return next;
        });

        const followUpUi = json.data.message?.ui ?? json.data.ui;
        if (followUpUi?.type === "form") {
          setActiveForm(followUpUi);
          setFormSubmitted(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit form");
      } finally {
        setFormSubmitting(false);
      }
    },
    [
      activeForm,
      agentId,
      widgetToken,
      formSubmitting,
      formSubmitted,
      isEscalated,
    ],
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
    suggestedMessages,
    sessionStatus,
    escalationMessage,
    isEscalated,
    isLoading,
    isProcessingVoice,
    isVoiceSupported,
    error,
    activeForm,
    formSubmitting,
    formSubmitted,
    sendMessage,
    submitForm,
    sendVoiceMessage,
    clearMessages,
  };
}
