"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildAgentChatApiUrl } from "@/lib/deploy/api-config";
import { useEmbedOrigin } from "@/lib/deploy/embed-urls";
import { cn } from "@/lib/utils";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "../chat-widget/ChatWidgetSettingRow";

type ApiSetupTabProps = {
  agentId: string;
  apiToken: string;
  apiEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  onRegenerateToken: () => void;
  regenerating: boolean;
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-surface-strong text-muted",
      )}
    >
      {label}
    </span>
  );
}

export function ApiSetupTab({
  agentId,
  apiToken,
  apiEnabled,
  isPublic,
  isActive,
  onRegenerateToken,
  regenerating,
}: ApiSetupTabProps) {
  const origin = useEmbedOrigin();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const endpointUrl = buildAgentChatApiUrl(origin, agentId);
  const maskedToken = `${apiToken.slice(0, 8)}${"•".repeat(24)}`;

  async function handleCopyToken() {
    try {
      await navigator.clipboard.writeText(apiToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  function handleConfirmRegenerate() {
    setConfirmOpen(false);
    onRegenerateToken();
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h3 className="text-title-sm font-medium text-ink">Prerequisites</h3>
        <p className="mt-1 text-body-sm text-muted">
          External API calls require a public, active agent with API deployment enabled.
          You can test from the Try panel before publishing.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">Agent is public</span>
            <div className="flex items-center gap-2">
              {!isPublic ? (
                <Link
                  href={`/dashboard/agents/${agentId}?tab=agent`}
                  className="text-caption text-primary hover:underline"
                >
                  Set visibility
                </Link>
              ) : null}
              <StatusPill ok={isPublic} label={isPublic ? "Public" : "Private"} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">Agent is active</span>
            <StatusPill ok={isActive} label={isActive ? "Active" : "Draft / inactive"} />
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">API deployment enabled</span>
            <StatusPill ok={apiEnabled} label={apiEnabled ? "Enabled" : "Disabled"} />
          </li>
        </ul>
      </div>

      <ChatWidgetSettingRow
        label="API key"
        description="Use this key in the Authorization header. Keep it secret — rotate if exposed."
      >
        <div className="flex gap-2">
          <input
            readOnly
            type={showToken ? "text" : "password"}
            value={showToken ? apiToken : maskedToken}
            className={cn(chatWidgetFieldInputClass, "font-mono text-caption")}
            aria-label="API key"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-lg border-hairline"
            onClick={() => setShowToken((v) => !v)}
            aria-label={showToken ? "Hide API key" : "Show API key"}
          >
            {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-lg border-hairline"
            onClick={handleCopyToken}
            aria-label="Copy API key"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-hairline text-body-sm"
            disabled={regenerating}
            onClick={() => setConfirmOpen(true)}
          >
            <RefreshCw className={cn("size-3.5", regenerating && "animate-spin")} />
            {regenerating ? "Regenerating…" : "Regenerate key"}
          </Button>
        </div>
      </ChatWidgetSettingRow>

      <ChatWidgetSettingRow label="Endpoint" noBorder>
        <div className="rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5">
          <p className="font-mono text-caption text-muted">
            <span className="font-semibold text-ink">POST</span> {endpointUrl}
          </p>
        </div>
        <p className="mt-2 text-caption text-muted">
          Request body:{" "}
          <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-caption">
            {"{ \"message\": \"...\", \"sessionId\": \"...\" }"}
          </code>
        </p>
      </ChatWidgetSettingRow>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API key?</DialogTitle>
            <DialogDescription>
              The current key will stop working immediately. Update any integrations using the
              old key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-hairline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-primary rounded-lg"
              onClick={handleConfirmRegenerate}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
