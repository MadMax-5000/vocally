"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboard.deploy");
  const tabs = useMemo((): DashboardTabItem<EmailConfigTabId>[] => {
    return [
      { id: "connection", label: t("common.connection") },
      { id: "settings", label: t("common.settings") },
    ];
  }, [t]);

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-hairline bg-surface-card">
      <div className="px-4 pt-3">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-3 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          {t("common.backToDeploy")}
        </Link>

        <div className="flex items-start justify-between gap-4 pb-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
              {t("email.title")}
            </h1>
            <p className="mt-1 text-caption text-muted">
              {t("email.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {emailEnabled ? t("common.enabled") : t("common.disabled")}
            </span>
            <Switch
              checked={emailEnabled}
              disabled={toggling}
              onCheckedChange={onEmailEnabledChange}
              aria-label={t("email.enable")}
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="emailManageTab"
        ariaLabel={t("email.configuration")}
        className="px-4"
      />
    </header>
  );
}
