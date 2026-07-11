"use client";

import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

export type MessengerConfigTabId = "connection";

type Props = {
  agentId: string;
  activeTab: MessengerConfigTabId;
  onTabChange: (t: MessengerConfigTabId) => void;
  enabled: boolean;
  toggling: boolean;
  onEnabledChange: (v: boolean) => void;
};

export function MessengerManageHeader({
  enabled,
  toggling,
  onEnabledChange,
}: Props) {
  const t = useTranslations("dashboard.deploy.channels.messenger");
  return (
    <div className="shrink-0 border-b border-hairline px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-title-sm font-medium text-ink">{t("title")}</p>
          <p className="mt-0.5 text-caption text-muted">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted">{enabled ? t("on") : t("off")}</span>
          <Switch checked={enabled} disabled={toggling} onCheckedChange={onEnabledChange} />
        </div>
      </div>
    </div>
  );
}

