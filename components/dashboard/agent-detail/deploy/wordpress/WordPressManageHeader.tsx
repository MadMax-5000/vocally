"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import { useMemo } from "react";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

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
  const t = useDeploySitesMessages().wordpress;
  const tabs = useMemo((): DashboardTabItem<WordPressConfigTabId>[] => {
    if (!wordpressEnabled) {
      return [{ id: "setup", label: t.tabs.setup }];
    }
    return [
      { id: "setup", label: t.tabs.setup },
      { id: "embed", label: t.tabs.embed },
      { id: "install", label: t.tabs.install },
    ];
  }, [t.tabs, wordpressEnabled]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          {t.header.backToDeploy}
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              {t.header.title}
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              {t.header.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {wordpressEnabled ? t.header.enabled : t.header.disabled}
            </span>
            <Switch
              checked={wordpressEnabled}
              disabled={toggling}
              onCheckedChange={onWordPressEnabledChange}
              aria-label={t.header.enable}
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="wordpressManageTab"
        ariaLabel={t.header.configuration}
        className="px-4"
      />
    </header>
  );
}
