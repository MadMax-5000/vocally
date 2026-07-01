"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CopyIcon } from "@/lib/icons/app-icons"

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useEmbedOrigin } from "@/lib/deploy/embed-urls";
import { buildApiSample, type ApiSampleLanguage } from "@/lib/deploy/api-samples";
import { cn } from "@/lib/utils";

type ApiExamplesTabProps = {
  agentId: string;
  apiToken: string;
};

const LANGUAGES: { id: ApiSampleLanguage; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
];

export function ApiExamplesTab({ agentId, apiToken }: ApiExamplesTabProps) {
  const origin = useEmbedOrigin();
  const [activeLanguage, setActiveLanguage] = useState<ApiSampleLanguage>("curl");
  const [copied, setCopied] = useState(false);

  const snippet = buildApiSample(activeLanguage, origin, agentId, apiToken);

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
          Send messages to your agent from your backend. Include your API key in the
          Authorization header.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => setActiveLanguage(lang.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors",
              activeLanguage === lang.id
                ? "bg-ink text-canvas"
                : "bg-surface-strong text-muted hover:text-ink",
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-hairline text-body-sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <AppIcon icon={CheckIcon} className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <AppIcon icon={CopyIcon} className="h-3.5 w-3.5" /> Copy code
            </>
          )}
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-xl border border-hairline bg-canvas-soft p-4 text-body-sm text-muted">
        <code>{snippet}</code>
      </pre>

      <p className="text-caption text-muted">
        Pass{" "}
        <code className="rounded bg-surface-strong px-1 py-0.5 font-mono">sessionId</code> from
        the response to continue a conversation across requests.
      </p>
    </div>
  );
}
