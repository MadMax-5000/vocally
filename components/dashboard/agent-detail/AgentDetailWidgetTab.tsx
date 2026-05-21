"use client";

import { useEffect, useState, useMemo } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { AgentDetailWithRelations } from "./agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

export function AgentDetailWidgetTab({ agent }: Props) {
  const [title, setTitle] = useState(agent.name);
  const [welcome, setWelcome] = useState(
    agent.welcomeMessage ?? "Hello! How can I help you today?",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTitle(agent.name);
    setWelcome(agent.welcomeMessage ?? "Hello! How can I help you today?");
  }, [agent]);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "https://app.vocally.ai";
    return window.location.origin;
  }, []);

  const embedUrl = `${origin}/widget/${agent.id}?token=${encodeURIComponent(agent.widgetToken ?? "")}&title=${encodeURIComponent(title)}&welcome=${encodeURIComponent(welcome)}`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  style="width:100%;height:600px;border:none;border-radius:12px"
  title="Chat with ${title}"
></iframe>`;

  const scriptSnippet = `<div id="vocally-widget"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = "${embedUrl}";
    iframe.style.cssText = 'position:fixed;bottom:24px;right:24px;width:380px;height:540px;border:none;border-radius:16px;z-index:2147483647;box-shadow:0 8px 32px rgba(0,0,0,0.12)';
    iframe.title = "Chat with ${title}";
    document.getElementById('vocally-widget').appendChild(iframe);
  })();
</script>`;

  const [activeSnippet, setActiveSnippet] = useState<"iframe" | "floating">("iframe");

  const snippet = activeSnippet === "iframe" ? iframeSnippet : scriptSnippet;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 py-4">
      <div>
        <h2 className="font-display text-display-sm font-normal tracking-tight text-ink">
          Embed Widget
        </h2>
        <p className="text-body-sm text-muted mt-1">
          Add this AI chat widget to any website. Your customers can start chatting instantly.
        </p>
      </div>

      {/* Configuration */}
      <div className="flex flex-col gap-3">
        <h3 className="text-title-sm font-medium text-ink">Configuration</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-muted">Widget title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg border-hairline text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-muted">Welcome message</label>
            <Input
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              className="h-9 rounded-lg border-hairline text-sm"
            />
          </div>
        </div>
      </div>

      {/* Embed type toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSnippet("iframe")}
          className={`rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors ${
            activeSnippet === "iframe"
              ? "bg-ink text-canvas"
              : "bg-surface-strong text-muted hover:text-ink"
          }`}
        >
          Inline iframe
        </button>
        <button
          type="button"
          onClick={() => setActiveSnippet("floating")}
          className={`rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors ${
            activeSnippet === "floating"
              ? "bg-ink text-canvas"
              : "bg-surface-strong text-muted hover:text-ink"
          }`}
        >
          Floating bubble
        </button>
      </div>

      {/* Embed code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-title-sm font-medium text-ink">Embed code</h3>
          <div className="flex items-center gap-2">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
            >
              Open preview
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg border-hairline text-body-sm"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy</>
              )}
            </Button>
          </div>
        </div>
        <pre className="rounded-xl border border-hairline bg-canvas-soft p-4 text-body-sm text-muted overflow-x-auto">
          <code>{snippet}</code>
        </pre>
        <p className="text-caption text-muted mt-2">
          {activeSnippet === "iframe"
            ? "Paste this iframe tag anywhere in your HTML where you want the chat to appear."
            : "Paste this snippet where you want the floating chat bubble to appear on your site."}
        </p>
      </div>
    </div>
  );
}
