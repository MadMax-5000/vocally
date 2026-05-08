"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";

type SelectableCardProps = {
  selected?: boolean;
  onClick?: () => void;
  icon?: ElementType;
  iconSrc?: string;
  title: string;
  className?: string;
};

export function SelectableCard({
  selected,
  onClick,
  icon: Icon,
  iconSrc,
  title,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center justify-center gap-2 rounded-xl border bg-surface-card px-4 py-5 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        selected
          ? "border-ink ring-1 ring-ink"
          : "border-hairline hover:border-hairline-strong",
        className
      )}
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" className="h-5 w-5" aria-hidden />
      ) : Icon ? (
        <Icon className="h-5 w-5 text-muted group-hover:text-ink transition-colors" aria-hidden />
      ) : null}
      <span className="text-body-sm font-medium text-ink">{title}</span>
    </button>
  );
}
