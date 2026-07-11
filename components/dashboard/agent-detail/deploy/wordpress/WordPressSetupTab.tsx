"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CopyIcon, DownloadIcon } from "@/lib/icons/app-icons"

import { useState } from "react";
import { Link } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import type { WordPressPluginDefaults } from "@/lib/deploy/wordpress-config";
import { cn } from "@/lib/utils";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

import {
  ChatWidgetSettingRow,
  chatWidgetFieldInputClass,
} from "../chat-widget/ChatWidgetSettingRow";

export const WORDPRESS_PLUGIN_DOWNLOAD_PATH = "/downloads/anselio-wordpress.zip";

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
  copyLabel,
}: {
  label: string;
  value: string;
  description?: string;
  noBorder?: boolean;
  copyLabel: string;
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
          aria-label={copyLabel.replace("{label}", label)}
        >
          {copied ? <AppIcon icon={CheckIcon} className="size-4" /> : <AppIcon icon={CopyIcon} className="size-4" />}
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
  const t = useDeploySitesMessages().wordpress.setup;

  if (!wordpressEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-canvas-soft px-6 py-12 text-center">
        <p className="text-body-sm text-muted">
          {t.disabled}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h3 className="text-title-sm font-medium text-ink">{t.prerequisites}</h3>
        <p className="mt-1 text-body-sm text-muted">
          {t.prerequisitesDescription}
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">{t.widgetEnabled}</span>
            <div className="flex items-center gap-2">
              {!webChatEnabled ? (
                <Link
                  href={`/dashboard/agents/${agentId}/deploy/chat-widget`}
                  className="text-caption text-primary hover:underline"
                >
                  {t.enableWidget}
                </Link>
              ) : null}
              <StatusPill ok={webChatEnabled} label={webChatEnabled ? t.enabled : t.disabledStatus} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">{t.agentPublic}</span>
            <div className="flex items-center gap-2">
              {!isPublic ? (
                <Link
                  href={`/dashboard/agents/${agentId}?tab=agent`}
                  className="text-caption text-primary hover:underline"
                >
                  {t.setVisibility}
                </Link>
              ) : null}
              <StatusPill ok={isPublic} label={isPublic ? t.public : t.private} />
            </div>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-body-sm text-ink">{t.agentActive}</span>
            <StatusPill ok={isActive} label={isActive ? t.active : t.draftInactive} />
          </li>
        </ul>
      </div>

      {!webChatEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-body-sm text-amber-900">
          {t.widgetWarning}{" "}
          <Link
            href={`/dashboard/agents/${agentId}/deploy/chat-widget`}
            className="font-medium text-primary hover:underline"
          >
            {t.openWidgetSettings}
          </Link>
        </div>
      ) : null}

      <div className="rounded-xl border border-hairline bg-canvas-soft/50 p-4">
        <h3 className="text-title-sm font-medium text-ink">{t.officialPlugin}</h3>
        <p className="mt-1 text-body-sm text-muted">
          {t.officialPluginDescription}
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
              <AppIcon icon={DownloadIcon} className="size-4" />
              {t.downloadPlugin}
            </a>
          </Button>
        </div>
      </div>

      <CopyField
        label={t.appUrl}
        value={pluginDefaults.appUrl}
        description={t.appUrlDescription}
        copyLabel={t.copy}
      />
      <CopyField label={t.agentId} value={pluginDefaults.agentId} copyLabel={t.copy} />
      {pluginDefaults.widgetToken ? (
        <CopyField
          label={t.widgetToken}
          value={pluginDefaults.widgetToken}
          description={t.widgetTokenDescription}
          copyLabel={t.copy}
        />
      ) : (
        <ChatWidgetSettingRow
          label={t.widgetToken}
          description={t.widgetTokenNotRequired}
        >
          <p className="text-body-sm text-muted">—</p>
        </ChatWidgetSettingRow>
      )}
      <CopyField
        label={t.embedUrl}
        value={pluginDefaults.embedUrl}
        description={t.embedUrlDescription}
        noBorder
        copyLabel={t.copy}
      />
    </div>
  );
}
