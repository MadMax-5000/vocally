"use client";

import Image from "next/image";
import Link from "next/link";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type DeployIntegrationCardProps = {
  title: string;
  description: string;
  iconSrc: string;
  manageHref: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  beta?: boolean;
  toggling?: boolean;
};

export function DeployIntegrationCard({
  title,
  description,
  iconSrc,
  manageHref,
  enabled,
  onEnabledChange,
  beta,
  toggling = false,
}: DeployIntegrationCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-[168px] flex-col rounded-xl border border-hairline bg-surface-card p-3",
        "transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-surface-card">
          <Image
            src={iconSrc}
            alt=""
            width={22}
            height={22}
            className="size-[22px] object-contain"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className="text-title-sm font-medium text-ink">{title}</h3>
          {beta ? (
            <span className="shrink-0 rounded-full bg-surface-strong px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted">
              Beta
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-2 flex-1 pl-[2.875rem] text-body-sm leading-relaxed text-muted">
        {description}
      </p>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Link href={manageHref} className="btn-outline shrink-0">
          Manage
        </Link>
        <Switch
          checked={enabled}
          disabled={toggling}
          onCheckedChange={onEnabledChange}
          aria-label={`Enable ${title}`}
        />
      </div>
    </article>
  );
}
