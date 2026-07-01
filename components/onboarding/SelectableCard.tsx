"use client";

import type { ComponentType } from "react";

import type { IconSvgElement } from "@/components/ui/app-icon";
import { AppIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

type SelectableCardProps = {
  selected?: boolean;
  onClick?: () => void;
  icon?: IconSvgElement;
  customIcon?: ComponentType<{ className?: string }>;
  iconSrc?: string;
  title: string;
  className?: string;
};

export function SelectableCard({
  selected,
  onClick,
  icon,
  customIcon: CustomIcon,
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong",
        selected
          ? "border-ink ring-1 ring-ink"
          : "border-hairline hover:border-hairline-strong",
        className
      )}
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" className="h-5 w-5" aria-hidden />
      ) : CustomIcon ? (
        <CustomIcon className="h-5 w-5 text-muted transition-colors group-hover:text-ink" />
      ) : icon ? (
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
