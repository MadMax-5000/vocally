"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import { useMemo } from "react";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

import type { HelpPageConfigTabId } from "./HelpPageConfigTabs";

type HelpPageManageHeaderProps = {
  agentId: string;
  activeTab: HelpPageConfigTabId;
  onTabChange: (tab: HelpPageConfigTabId) => void;
  helpPageEnabled: boolean;
  toggling: boolean;
  onHelpPageEnabledChange: (enabled: boolean) => void;
};

export function HelpPageManageHeader({
  agentId,
  activeTab,
  onTabChange,
  helpPageEnabled,
  toggling,
  onHelpPageEnabledChange,
}: HelpPageManageHeaderProps) {
  const t = useDeploySitesMessages().helpPage.header;
  const tabs = useMemo((): DashboardTabItem<HelpPageConfigTabId>[] => {
    const items: DashboardTabItem<HelpPageConfigTabId>[] = [
      { id: "settings", label: t.tabs.settings },
    ];
    if (helpPageEnabled) {
      items.push({ id: "embed", label: t.tabs.embed });
    }
    return items;
  }, [helpPageEnabled, t.tabs]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          {t.backToDeploy}
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              {t.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {helpPageEnabled ? t.enabled : t.disabled}
            </span>
            <Switch
              checked={helpPageEnabled}
              disabled={toggling}
              onCheckedChange={onHelpPageEnabledChange}
              aria-label={t.enable}
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="helpPageManageTab"
        ariaLabel={t.configuration}
        className="px-4"
      />
    </header>
  );
}
