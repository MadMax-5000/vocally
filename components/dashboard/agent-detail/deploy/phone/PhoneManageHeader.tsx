"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import Link from "next/link";
import { useMemo } from "react";

import {
  DashboardTabBar,
  type DashboardTabItem,
} from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { PhoneConfigTabId } from "./PhoneConfigTabs";

type PhoneManageHeaderProps = {
  agentId: string;
  activeTab: PhoneConfigTabId;
  onTabChange: (tab: PhoneConfigTabId) => void;
  phoneEnabled: boolean;
  toggling: boolean;
  onPhoneEnabledChange: (enabled: boolean) => void;
};

export function PhoneManageHeader({
  agentId,
  activeTab,
  onTabChange,
  phoneEnabled,
  toggling,
  onPhoneEnabledChange,
}: PhoneManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<PhoneConfigTabId>[] => {
    if (!phoneEnabled) return [{ id: "numbers", label: "Numbers" }];
    return [
      { id: "numbers", label: "Numbers" },
      { id: "settings", label: "Settings" },
    ];
  }, [phoneEnabled]);

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
              Phone
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              Connect a Twilio number via Vapi for AI voice calls
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {phoneEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={phoneEnabled}
              disabled={toggling}
              onCheckedChange={onPhoneEnabledChange}
              aria-label="Enable phone deployment"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="phoneManageTab"
        ariaLabel="Phone configuration"
        className="px-4"
      />
    </header>
  );
}
