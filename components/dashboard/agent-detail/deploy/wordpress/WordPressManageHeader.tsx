"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import Link from "next/link";
import { useMemo } from "react";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { WordPressConfigTabId } from "./WordPressConfigTabs";

type WordPressManageHeaderProps = {
  agentId: string;
  activeTab: WordPressConfigTabId;
  onTabChange: (tab: WordPressConfigTabId) => void;
  wordpressEnabled: boolean;
  toggling: boolean;
  onWordPressEnabledChange: (enabled: boolean) => void;
};

export function WordPressManageHeader({
  agentId,
  activeTab,
  onTabChange,
  wordpressEnabled,
  toggling,
  onWordPressEnabledChange,
}: WordPressManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<WordPressConfigTabId>[] => {
    if (!wordpressEnabled) {
      return [{ id: "setup", label: "Setup" }];
    }
    return [
      { id: "setup", label: "Setup" },
      { id: "embed", label: "Embed code" },
      { id: "install", label: "Install on WordPress" },
    ];
  }, [wordpressEnabled]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          Back to Deploy
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              WordPress
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              Connect your agent to WordPress with the official plugin or embed code
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {wordpressEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={wordpressEnabled}
              disabled={toggling}
              onCheckedChange={onWordPressEnabledChange}
              aria-label="Enable WordPress deployment"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="wordpressManageTab"
        ariaLabel="WordPress configuration"
        className="px-4"
      />
    </header>
  );
}
