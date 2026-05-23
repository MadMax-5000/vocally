"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildWidgetEmbedUrl, useEmbedOrigin } from "@/lib/deploy/embed-urls";
import { resolveWidgetDisplayName } from "@/lib/deploy/web-chat-config";
import { cn } from "@/lib/utils";

import type { ChatWidgetDraft } from "./chat-widget-draft";

type ChatWidgetEmbedSectionProps = {
  agentId: string;
  agentName: string;
  widgetToken: string | null;
  draft: ChatWidgetDraft;
};

export function ChatWidgetEmbedSection({
  agentId,
  agentName,
  widgetToken,
  draft,
}: ChatWidgetEmbedSectionProps) {
  const origin = useEmbedOrigin();
  const [copied, setCopied] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<"iframe" | "floating">("iframe");

  const title = resolveWidgetDisplayName(agentName, {
    displayName: draft.widget.displayName.trim() || undefined,
  });
  const welcome = draft.welcomeMessage.trim() || "Hello! How can I help you today?";

  const embedUrl = buildWidgetEmbedUrl(origin, agentId, widgetToken, title, welcome);

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
    <div className="space-y-4">
      <div>
        <p className="text-body-sm text-muted">
          Add this widget to your website. Snippets use your saved display name and welcome
          message — save any changes on Content before copying.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSnippet("iframe")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
            activeSnippet === "iframe"
              ? "bg-ink text-canvas"
              : "bg-surface-strong text-muted hover:text-ink",
          )}
        >
          Inline iframe
        </button>
        <button
          type="button"
          onClick={() => setActiveSnippet("floating")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
            activeSnippet === "floating"
              ? "bg-ink text-canvas"
              : "bg-surface-strong text-muted hover:text-ink",
          )}
        >
          Floating bubble
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
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
              <Copy className="h-3.5 w-3.5" /> Copy code
            </>
          )}
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-xl border border-hairline bg-canvas-soft p-4 text-body-sm text-muted">
        <code>{snippet}</code>
      </pre>
      <p className="text-caption text-muted">
        {activeSnippet === "iframe"
          ? "Paste this iframe tag anywhere in your HTML where you want the chat to appear."
          : "Paste this snippet where you want the floating chat bubble to appear on your site."}
      </p>
    </div>
  );
}
