"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WordPressPluginDefaults } from "@/lib/deploy/wordpress-config";
import { cn } from "@/lib/utils";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "../chat-widget/ChatWidgetSettingRow";

export const WORDPRESS_PLUGIN_DOWNLOAD_PATH = "/downloads/vocally-wordpress.zip";

type WordPressSetupTabProps = {
  agentId: string;
  wordpressEnabled: boolean;
  webChatEnabled: boolean;
  isPublic: boolean;
  isActive: boolean;
  pluginDefaults: WordPressPluginDefaults;
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

function CopyField({
  label,
  value,
  description,
  noBorder,
}: {
  label: string;
  value: string;
  description?: string;
  noBorder?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  }

  return (
    <ChatWidgetSettingRow label={label} description={description} noBorder={noBorder}>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          className={cn(chatWidgetFieldInputClass, "font-mono text-caption")}
          aria-label={label}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-lg border-hairline"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </ChatWidgetSettingRow>
  );
}

export function WordPressSetupTab({
  agentId,
  wordpressEnabled,
  webChatEnabled,
  isPublic,
  isActive,
  pluginDefaults,
}: WordPressSetupTabProps) {
  if (!wordpressEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
        <p className="text-body-sm text-muted">
          Enable WordPress deployment using the switch above to configure the plugin and embed
          code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h3 className="text-title-sm font-medium text-ink">Prerequisites</h3>
        <p className="mt-1 text-body-sm text-muted">
          WordPress embeds your hosted chat widget. Enable the chat widget and make the agent
          public and active so visitors can chat.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">Chat widget enabled</span>
            <div className="flex items-center gap-2">
              {!webChatEnabled ? (
                <Link
                  href={`/dashboard/agents/${agentId}/deploy/chat-widget`}
                  className="text-caption text-primary hover:underline"
                >
                  Enable widget
                </Link>
              ) : null}
              <StatusPill ok={webChatEnabled} label={webChatEnabled ? "Enabled" : "Disabled"} />
            </div>
          </li>
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
        </ul>
      </div>

      {!webChatEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-body-sm text-amber-900">
          Turn on the chat widget before embedding on WordPress.{" "}
          <Link
            href={`/dashboard/agents/${agentId}/deploy/chat-widget`}
            className="font-medium text-primary hover:underline"
          >
            Open chat widget settings
          </Link>
        </div>
      ) : null}

      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h3 className="text-title-sm font-medium text-ink">Official plugin</h3>
        <p className="mt-1 text-body-sm text-muted">
          Download the Vocally plugin, then paste these values under Settings → Vocally in
          WordPress.
        </p>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg border-hairline text-body-sm"
            asChild
          >
            <a href={WORDPRESS_PLUGIN_DOWNLOAD_PATH} download>
              <Download className="size-4" />
              Download plugin (.zip)
            </a>
          </Button>
        </div>
      </div>

      <CopyField
        label="Vocally App URL"
        value={pluginDefaults.appUrl}
        description="Your Vocally dashboard origin (no trailing slash)."
      />
      <CopyField label="Agent ID" value={pluginDefaults.agentId} />
      {pluginDefaults.widgetToken ? (
        <CopyField
          label="Widget token"
          value={pluginDefaults.widgetToken}
          description="Required for private agents — copy from your agent security settings if needed."
        />
      ) : (
        <ChatWidgetSettingRow
          label="Widget token"
          description="Not required for public agents without a widget token."
        >
          <p className="text-body-sm text-muted">—</p>
        </ChatWidgetSettingRow>
      )}
      <CopyField
        label="Widget embed URL"
        value={pluginDefaults.embedUrl}
        description="Full iframe URL — used by the plugin and manual embed snippets."
        noBorder
      />
    </div>
  );
}
