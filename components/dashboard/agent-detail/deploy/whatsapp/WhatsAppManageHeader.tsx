"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

import {
  DashboardTabBar,
  type DashboardTabItem,
} from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { WhatsAppConfigTabId } from "./WhatsAppConfigTabs";

type WhatsAppManageHeaderProps = {
  agentId: string;
  activeTab: WhatsAppConfigTabId;
  onTabChange: (tab: WhatsAppConfigTabId) => void;
  whatsappEnabled: boolean;
  toggling: boolean;
  onWhatsappEnabledChange: (enabled: boolean) => void;
};

export function WhatsAppManageHeader({
  agentId,
  activeTab,
  onTabChange,
  whatsappEnabled,
  toggling,
  onWhatsappEnabledChange,
}: WhatsAppManageHeaderProps) {
  const tabs = useMemo((): DashboardTabItem<WhatsAppConfigTabId>[] => {
    if (!whatsappEnabled) return [{ id: "setup", label: "Setup" }];
    return [
      { id: "setup", label: "Setup" },
      { id: "connect", label: "Connect" },
      { id: "test", label: "Test" },
    ];
  }, [whatsappEnabled]);

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
              WhatsApp
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              Connect a WhatsApp sender and auto-reply via Twilio
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {whatsappEnabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={whatsappEnabled}
              disabled={toggling}
              onCheckedChange={onWhatsappEnabledChange}
              aria-label="Enable WhatsApp deployment"
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="whatsappManageTab"
        ariaLabel="WhatsApp configuration"
        className="px-4"
      />
    </header>
  );
}
