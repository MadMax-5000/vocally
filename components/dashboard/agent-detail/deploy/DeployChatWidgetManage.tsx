"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeployManageShell } from "@/components/dashboard/agent-detail/deploy/DeployManageShell";
import {
  buildWidgetEmbedUrl,
  useEmbedOrigin,
} from "@/lib/deploy/embed-urls";

import type { AgentDetailWithRelations } from "../agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

export function DeployChatWidgetManage({ agent }: Props) {
  const origin = useEmbedOrigin();
  const [title, setTitle] = useState(agent.name);
  const [welcome, setWelcome] = useState(
    agent.welcomeMessage ?? "Hello! How can I help you today?",
  );
  const [copied, setCopied] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<"iframe" | "floating">("iframe");

  useEffect(() => {
    setTitle(agent.name);
    setWelcome(agent.welcomeMessage ?? "Hello! How can I help you today?");
  }, [agent]);

  const embedUrl = buildWidgetEmbedUrl(
    origin,
    agent.id,
    agent.widgetToken,
    title,
    welcome,
  );

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

  const snippet = activeSnippet === "iframe" ? iframeSnippet : scriptSnippet;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  return (
    <DeployManageShell
      agentId={agent.id}
      title="Chat widget"
      description="Add this AI chat widget to any website. Your customers can start chatting instantly."
    >
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

      <div>
        <div className="mb-2 flex items-center justify-between">
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
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-hairline bg-canvas-soft p-4 text-body-sm text-muted">
          <code>{snippet}</code>
        </pre>
        <p className="mt-2 text-caption text-muted">
          {activeSnippet === "iframe"
            ? "Paste this iframe tag anywhere in your HTML where you want the chat to appear."
            : "Paste this snippet where you want the floating chat bubble to appear on your site."}
        </p>
      </div>
    </DeployManageShell>
  );
}
