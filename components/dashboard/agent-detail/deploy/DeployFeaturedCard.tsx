"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type DeployFeaturedCardProps = {
  title: string;
  description: string;
  heroBackground: string;
  heroPreview: ReactNode;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  manageHref: string;
  manageLabel?: string;
  toggling?: boolean;
};

export function DeployFeaturedCard({
  title,
  description,
  heroBackground,
  heroPreview,
  enabled,
  onEnabledChange,
  manageHref,
  manageLabel = "Manage",
  toggling = false,
}: DeployFeaturedCardProps) {
  const t = useTranslations("dashboard.deploy");
  return (
    <article
      className={cn(
        "flex min-h-[380px] flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card",
        "transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
      )}
    >
      <div
        className="relative min-h-[300px] flex-1 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {heroPreview}
      </div>

      <div className="shrink-0 border-t border-hairline-soft px-4 py-3.5">
        <h3 className="font-display text-title-sm font-medium text-ink">{title}</h3>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="min-w-0 flex-1 text-body-sm leading-relaxed text-muted">
            {description}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={manageHref} className="btn-outline shrink-0">
              {manageLabel}
            </Link>
            <Switch
              checked={enabled}
              disabled={toggling}
              onCheckedChange={onEnabledChange}
              aria-label={t("featuredCard.enable", { title })}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
