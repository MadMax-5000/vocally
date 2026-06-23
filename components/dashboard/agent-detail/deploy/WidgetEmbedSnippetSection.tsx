"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildWidgetEmbedUrl, useEmbedOrigin } from "@/lib/deploy/embed-urls";
import {
  buildWidgetEmbedSnippet,
  type WidgetEmbedSnippetKind,
} from "@/lib/deploy/widget-embed-snippets";
import { cn } from "@/lib/utils";

type WidgetEmbedSnippetSectionProps = {
  embedUrl: string;
  description: string;
  iframeHint: string;
  floatingHint: string;
};

export function WidgetEmbedSnippetSection({
  embedUrl,
  description,
  iframeHint,
  floatingHint,
}: WidgetEmbedSnippetSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<WidgetEmbedSnippetKind>("iframe");

  const titleMatch = embedUrl.match(/[?&]title=([^&]+)/);
  const title = titleMatch
    ? decodeURIComponent(titleMatch[1].replace(/\+/g, " "))
    : "Support";

  const snippet = buildWidgetEmbedSnippet(activeSnippet, embedUrl, title);

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
        <p className="text-body-sm text-muted">{description}</p>
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
        {activeSnippet === "iframe" ? iframeHint : floatingHint}
      </p>
    </div>
  );
}

type WidgetEmbedFromAgentProps = {
  agentId: string;
  agentName: string;
  widgetToken: string | null;
  title: string;
  welcome: string;
  description: string;
  iframeHint: string;
  floatingHint: string;
};

export function WidgetEmbedFromAgent({
  agentId,
  widgetToken,
  title,
  welcome,
  description,
  iframeHint,
  floatingHint,
}: WidgetEmbedFromAgentProps) {
  const origin = useEmbedOrigin();
  const embedUrl = buildWidgetEmbedUrl(origin, agentId, widgetToken, title, welcome);

  return (
    <WidgetEmbedSnippetSection
      embedUrl={embedUrl}
      description={description}
      iframeHint={iframeHint}
      floatingHint={floatingHint}
    />
  );
}
