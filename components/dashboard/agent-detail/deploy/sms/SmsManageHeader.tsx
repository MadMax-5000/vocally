"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import {
  DashboardTabBar,
  type DashboardTabItem,
} from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { SmsConfigTabId } from "./SmsConfigTabs";

type SmsManageHeaderProps = {
  agentId: string;
  activeTab: SmsConfigTabId;
  onTabChange: (tab: SmsConfigTabId) => void;
  smsEnabled: boolean;
  toggling: boolean;
  onSmsEnabledChange: (enabled: boolean) => void;
};

export function SmsManageHeader({
  agentId,
  activeTab,
  onTabChange,
  smsEnabled,
  toggling,
  onSmsEnabledChange,
}: SmsManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<SmsConfigTabId>[] => {
    if (!smsEnabled) return [{ id: "setup", label: "Setup" }];
    return [
      { id: "setup", label: "Setup" },
      { id: "connect", label: "Connect" },
      { id: "test", label: "Test" },
    ];
  }, [smsEnabled]);

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
              SMS
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              Connect a Twilio number and let your agent auto-reply to SMS
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {smsEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={smsEnabled}
              disabled={toggling}
              onCheckedChange={onSmsEnabledChange}
              aria-label="Enable SMS deployment"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="smsManageTab"
        ariaLabel="SMS configuration"
        className="px-4"
      />
    </header>
  );
}
