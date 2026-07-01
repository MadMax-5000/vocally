"use client";

import type { IconSvgElement } from "@/components/ui/app-icon";
import { AppIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

type CustomCardProps = {
  selected?: boolean;
  onSelect?: () => void;
  icon?: IconSvgElement;
  title: string;
  className?: string;
};

export function CustomCard({
  selected,
  onSelect,
  icon,
  title,
  className,
}: CustomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col items-center justify-center gap-2 rounded-xl border bg-surface-card px-4 py-5 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong",
        selected
          ? "border-ink ring-1 ring-ink"
          : "border-hairline hover:border-hairline-strong",
        className
      )}
    >
      {icon ? (
        <AppIcon
          icon={icon}
          size={20}
          className="text-muted group-hover:text-ink transition-colors"
          aria-hidden
        />
      ) : null}
      <span className="text-body-sm font-medium text-ink">{title}</span>
    </button>
  );
}
