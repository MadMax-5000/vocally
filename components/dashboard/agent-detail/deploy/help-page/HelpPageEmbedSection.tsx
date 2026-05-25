"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildHelpEmbedUrl, buildHelpPageUrl, useEmbedOrigin } from "@/lib/deploy/embed-urls";
import { cn } from "@/lib/utils";

type HelpPageEmbedSectionProps = {
  agentId: string;
  widgetToken: string | null;
  pageTitle: string;
};

export function HelpPageEmbedSection({
  agentId,
  widgetToken,
  pageTitle,
}: HelpPageEmbedSectionProps) {
  const origin = useEmbedOrigin();
  const [copied, setCopied] = useState<"page" | "snippet" | null>(null);
  const [activeSnippet, setActiveSnippet] = useState<"iframe" | "link">("iframe");

  const pageUrl = buildHelpPageUrl(origin, agentId);
  const shareUrl = buildHelpEmbedUrl(origin, agentId, widgetToken);
  const title = pageTitle.trim() || "Help center";

  const iframeSnippet = `<iframe
  src="${shareUrl}"
  style="width:100%;min-height:720px;border:none"
  title="Help — ${title}"
></iframe>`;

  const linkSnippet = `<a href="${shareUrl}">Open help center</a>`;
  const snippet = activeSnippet === "iframe" ? iframeSnippet : linkSnippet;

  async function handleCopy(text: string, kind: "page" | "snippet") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h4 className="text-body-sm font-medium text-ink">Page link</h4>
          <p className="mt-1 text-caption text-muted">
            Share this URL so customers can open your standalone help page. Append{" "}
            <code className="rounded bg-surface-strong px-1 py-0.5 text-[11px]">
              ?token=YOUR_TOKEN
            </code>{" "}
            for public access.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas-soft p-3">
          <code className="min-w-0 flex-1 truncate text-body-sm text-ink">{pageUrl}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-lg border-hairline text-body-sm"
            onClick={() => handleCopy(pageUrl, "page")}
          >
            {copied === "page" ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy link
              </>
            )}
          </Button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-body-sm text-primary hover:underline"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="space-y-4 border-t border-hairline pt-6">
        <p className="text-body-sm text-muted">
          Or embed the help page on your site. Branding comes from your saved settings.
        </p>

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
            Embed iframe
          </button>
          <button
            type="button"
            onClick={() => setActiveSnippet("link")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
              activeSnippet === "link"
                ? "bg-ink text-canvas"
                : "bg-surface-strong text-muted hover:text-ink",
            )}
          >
            HTML link
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-hairline text-body-sm"
            onClick={() => handleCopy(snippet, "snippet")}
          >
            {copied === "snippet" ? (
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
      </div>
    </div>
  );
}
