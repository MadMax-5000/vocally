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
  comingSoon?: boolean;
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
  comingSoon = false,
  toggling = false,
}: DeployIntegrationCardProps) {
  if (comingSoon) {
    return (
      <article
        aria-disabled
        className={cn(
          "relative flex min-h-[168px] flex-col overflow-hidden rounded-xl",
          "border border-dashed border-hairline-strong bg-surface-strong/80",
        )}
      >
        <div className="pointer-events-none flex flex-1 flex-col p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-canvas-soft">
              <Image
                src={iconSrc}
                alt=""
                width={22}
                height={22}
                className="size-[22px] object-contain opacity-40 grayscale"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 className="text-title-sm font-medium text-muted">{title}</h3>
              <span className="shrink-0 rounded-pill bg-canvas-soft px-2 py-0.5 text-xs text-muted-soft">
                Coming soon
              </span>
            </div>
          </div>

          <p className="mt-2 flex-1 pl-[2.875rem] text-body-sm leading-relaxed text-muted-soft">
            {description}
          </p>

          <p className="mt-3 text-right text-caption text-muted-soft">
            Not available yet
          </p>
        </div>
      </article>
    );
  }

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
            <span className="shrink-0 rounded-pill bg-surface-strong px-2 py-0.5 text-caption-uppercase text-muted">
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
