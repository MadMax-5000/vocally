"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon, SendIcon } from "@/lib/icons/app-icons"

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildAgentChatApiUrl } from "@/lib/deploy/api-config";
import { useEmbedOrigin } from "@/lib/deploy/embed-urls";
import { cn } from "@/lib/utils";

type ApiTryPanelProps = {
  agentId: string;
  apiToken: string;
};

type ChatTurn = {
  role: "user" | "bot";
  content: string;
};

type ApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    sessionId: string;
    message?: { content: string };
  };
};

export function ApiTryPanel({ agentId, apiToken }: ApiTryPanelProps) {
  const origin = useEmbedOrigin();
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setTurns((prev) => [...prev, { role: "user", content: trimmed }]);
    setMessage("");

    try {
      const url = buildAgentChatApiUrl(origin, agentId);
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          ...(sessionId ? { sessionId } : {}),
        }),
      });

      const json = (await res.json()) as ApiResponse;
      setLastResponse(JSON.stringify(json, null, 2));

      if (!res.ok || !json.success) {
        const errMsg = json.error ?? `Request failed (${res.status})`;
        setError(errMsg);
        return;
      }

      if (json.data?.sessionId) {
        setSessionId(json.data.sessionId);
      }

      const botContent = json.data?.message?.content;
      if (botContent) {
        setTurns((prev) => [...prev, { role: "bot", content: botContent }]);
      }
    } catch {
      setError("Network error — could not reach the API");
    } finally {
      setLoading(false);
    }
  }, [agentId, apiToken, loading, message, origin, sessionId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function handleReset() {
    setSessionId(null);
    setTurns([]);
    setLastResponse(null);
    setError(null);
    setMessage("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Try API</h3>
        {sessionId || turns.length > 0 ? (
          <button
            type="button"
            onClick={handleReset}
            className="text-caption text-muted hover:text-ink"
          >
            Reset session
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {turns.length === 0 ? (
              <p className="text-body-sm text-muted">
                Send a test message to preview API responses. Uses your dashboard session for
                testing before the agent is public.
              </p>
            ) : (
              <div className="space-y-3">
                {turns.map((turn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-body-sm",
                      turn.role === "user"
                        ? "ml-auto bg-ink text-canvas"
                        : "bg-canvas-soft text-ink",
                    )}
                  >
                    {turn.content}
                  </div>
                ))}
                {loading ? (
                  <div className="flex items-center gap-2 text-body-sm text-muted">
                    <AppIcon icon={LoaderIcon} className="size-4 animate-spin" />
                    Waiting for response…
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {sessionId ? (
            <div className="border-t border-hairline px-4 py-2">
              <p className="truncate font-mono text-caption text-muted">
                sessionId: {sessionId}
              </p>
            </div>
          ) : null}

          <div className="flex shrink-0 gap-2 border-t border-hairline p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a test message…"
              rows={2}
              disabled={loading}
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-hairline bg-canvas-soft px-3 py-2 text-body-sm focus-visible:border-ink focus-visible:outline-none focus-visible:ring-0"
            />
            <Button
              type="button"
              className="btn-primary h-auto shrink-0 rounded-lg px-3"
              disabled={!message.trim() || loading}
              onClick={() => void sendMessage()}
              aria-label="Send test message"
            >
              {loading ? (
                <AppIcon icon={LoaderIcon} className="size-4 animate-spin" />
              ) : (
                <AppIcon icon={SendIcon} className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700">
            {error}
          </div>
        ) : null}

        {lastResponse ? (
          <div className="min-h-0 shrink-0">
            <p className="mb-1.5 text-caption font-medium text-muted">Last response</p>
            <pre className="max-h-40 overflow-auto rounded-lg border border-hairline bg-canvas-soft p-3 font-mono text-caption text-muted">
              {lastResponse}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
