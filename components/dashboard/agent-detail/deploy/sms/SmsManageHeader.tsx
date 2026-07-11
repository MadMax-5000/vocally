"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.deploy.messaging.sms");
  const tabs = useMemo((): DashboardTabItem<SmsConfigTabId>[] => {
    if (!smsEnabled) return [{ id: "setup", label: t("tabs.setup") }];
    return [
      { id: "setup", label: t("tabs.setup") },
      { id: "connect", label: t("tabs.connect") },
      { id: "test", label: t("tabs.test") },
    ];
  }, [smsEnabled, t]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          {t("header.backToDeploy")}
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              {t("header.title")}
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              {t("header.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {smsEnabled ? t("header.enabled") : t("header.disabled")}
            </span>
            <Switch
              checked={smsEnabled}
              disabled={toggling}
              onCheckedChange={onSmsEnabledChange}
              aria-label={t("header.enable")}
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="smsManageTab"
        ariaLabel={t("header.configuration")}
        className="px-4"
      />
    </header>
  );
}
