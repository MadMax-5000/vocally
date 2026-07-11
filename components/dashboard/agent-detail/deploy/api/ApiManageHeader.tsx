"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { DashboardTabBar, type DashboardTabItem } from "@/components/dashboard/DashboardTabBar";
import { Switch } from "@/components/ui/switch";

import type { ApiConfigTabId } from "./ApiConfigTabs";

type ApiManageHeaderProps = {
  agentId: string;
  activeTab: ApiConfigTabId;
  onTabChange: (tab: ApiConfigTabId) => void;
  apiEnabled: boolean;
  toggling: boolean;
  onApiEnabledChange: (enabled: boolean) => void;
};

export function ApiManageHeader({
  agentId,
  activeTab,
  onTabChange,
  apiEnabled,
  toggling,
  onApiEnabledChange,
}: ApiManageHeaderProps) {
  const t = useTranslations("dashboard.deploy");
  const tabs = useMemo((): DashboardTabItem<ApiConfigTabId>[] => {
    const items: DashboardTabItem<ApiConfigTabId>[] = [{ id: "setup", label: t("common.setup") }];
    if (apiEnabled) {
      items.push({ id: "examples", label: t("common.examples") });
    }
    return items;
  }, [apiEnabled, t]);

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
              {t("api.title")}
            </h1>
            <p className="mt-0.5 text-body-sm text-muted">
              {t("api.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="text-caption text-muted">
              {apiEnabled ? t("common.enabled") : t("common.disabled")}
            </span>
            <Switch
              checked={apiEnabled}
              disabled={toggling}
              onCheckedChange={onApiEnabledChange}
              aria-label={t("api.enable")}
            />
          </div>
        </div>
      </div>

      <DashboardTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        layoutId="apiManageTab"
        ariaLabel={t("api.configuration")}
        className="px-4"
      />
    </header>
  );
}
