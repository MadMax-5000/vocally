"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import { cn } from "@/lib/utils";

type AppIconProps = {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function AppIcon({
  icon,
  size = 20,
  strokeWidth = 1.75,
  className,
}: AppIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn(className)}
    />
  );
}

export type { IconSvgElement };
