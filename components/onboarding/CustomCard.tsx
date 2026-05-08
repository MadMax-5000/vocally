"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomCardProps = {
  selected?: boolean;
  onSelect?: () => void;
  icon?: LucideIcon;
  title: string;
  className?: string;
};

export function CustomCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  className,
}: CustomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col items-center justify-center gap-2 rounded-xl border bg-surface-card px-4 py-5 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        selected
          ? "border-ink ring-1 ring-ink"
          : "border-hairline hover:border-hairline-strong",
        className
      )}
    >
      {Icon ? (
        <Icon className="h-5 w-5 text-muted group-hover:text-ink transition-colors" aria-hidden />
      ) : null}
      <span className="text-body-sm font-medium text-ink">{title}</span>
    </button>
  );
}
