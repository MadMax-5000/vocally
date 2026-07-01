"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import Link from "next/link";
import { useMemo } from "react";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { EmailConfigTabId } from "./EmailConfigTabs";

type EmailManageHeaderProps = {
  agentId: string;
  activeTab: EmailConfigTabId;
  onTabChange: (tab: EmailConfigTabId) => void;
  emailEnabled: boolean;
  toggling: boolean;
  onEmailEnabledChange: (enabled: boolean) => void;
};

export function EmailManageHeader({
  agentId,
  activeTab,
  onTabChange,
  emailEnabled,
  toggling,
  onEmailEnabledChange,
}: EmailManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<EmailConfigTabId>[] => {
    return [
      { id: "connection", label: "Connection" },
      { id: "settings", label: "Settings" },
    ];
  }, []);

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
              Gmail
            </h1>
            <p className="mt-1 text-caption text-muted">
              Connect your inbox so this agent can reply to customer emails.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {emailEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={emailEnabled}
              disabled={toggling}
              onCheckedChange={onEmailEnabledChange}
              aria-label="Enable email channel"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="emailManageTab"
        ariaLabel="Gmail configuration"
        className="px-4"
      />
    </header>
  );
}
