"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import {
  DashboardTabBar,
  type DashboardTabItem,
} from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { InstagramConfigTabId } from "./InstagramConfigTabs";

type InstagramManageHeaderProps = {
  agentId: string;
  activeTab: InstagramConfigTabId;
  onTabChange: (tab: InstagramConfigTabId) => void;
  instagramEnabled: boolean;
  toggling: boolean;
  onInstagramEnabledChange: (enabled: boolean) => void;
};

export function InstagramManageHeader({
  agentId,
  activeTab,
  onTabChange,
  instagramEnabled,
  toggling,
  onInstagramEnabledChange,
}: InstagramManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<InstagramConfigTabId>[] => {
    if (!instagramEnabled) return [{ id: "setup", label: "Setup" }];
    return [
      { id: "setup", label: "Setup" },
      { id: "test", label: "Test" },
    ];
  }, [instagramEnabled]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back to Deploy
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              Instagram
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              Connect your agent to Instagram DMs and auto-reply to customers
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {instagramEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={instagramEnabled}
              disabled={toggling}
              onCheckedChange={onInstagramEnabledChange}
              aria-label="Enable Instagram deployment"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="instagramManageTab"
        ariaLabel="Instagram configuration"
        className="px-4"
      />
    </header>
  );
}

