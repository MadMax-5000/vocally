"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeployManageShell } from "@/components/dashboard/agent-detail/deploy/DeployManageShell";
import { buildHelpEmbedUrl, useEmbedOrigin } from "@/lib/deploy/embed-urls";

import type { AgentDetailWithRelations } from "../agent-detail-types";

type Props = { agent: AgentDetailWithRelations };

export function DeployHelpPageManage({ agent }: Props) {
  const origin = useEmbedOrigin();
  const [title, setTitle] = useState(agent.name);
  const [welcome, setWelcome] = useState(
    agent.welcomeMessage ?? "Hello! How can I help you today?",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTitle(agent.name);
    setWelcome(agent.welcomeMessage ?? "Hello! How can I help you today?");
  }, [agent]);

  const embedUrl = buildHelpEmbedUrl(
    origin,
    agent.id,
    agent.widgetToken,
    title,
    welcome,
  );

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  style="width:100%;min-height:720px;border:none"
  title="Help — ${title}"
></iframe>`;

  const linkSnippet = `<!-- Standalone help page -->
<a href="${embedUrl.replace(/\?.*$/, "")}?token=YOUR_TOKEN">Open help center</a>`;

  const [activeSnippet, setActiveSnippet] = useState<"iframe" | "link">("iframe");
  const snippet = activeSnippet === "iframe" ? iframeSnippet : linkSnippet;

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
      title="Help page"
      description="Deploy a ChatGPT-style help center on your site or at /help."
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-title-sm font-medium text-ink">Configuration</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-muted">Page title</label>
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
          Embed iframe
        </button>
        <button
          type="button"
          onClick={() => setActiveSnippet("link")}
          className={`rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors ${
            activeSnippet === "link"
              ? "bg-ink text-canvas"
              : "bg-surface-strong text-muted hover:text-ink"
          }`}
        >
          Direct link
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
            ? "Embed the full help center in a page on your site."
            : "Share the help page URL with the query parameters from the preview link."}
        </p>
      </div>
    </DeployManageShell>
  );
}
