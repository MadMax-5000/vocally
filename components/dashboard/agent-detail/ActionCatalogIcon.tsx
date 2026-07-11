import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CodeIcon,
  Cursor01Icon,
  File01Icon,
  Message01Icon,
  Sun01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import type { ActionIconKey } from "./action-catalog";
import { EscalationIconStack } from "./EscalationIconStack";
import { cn } from "@/lib/utils";

const ICON_PLATE_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-card";

const SVG_ICONS: Partial<
  Record<ActionIconKey, { src: string; size?: "default" | "large" }>
> = {
  api: { src: "/svg/api.svg" },
  stripe: { src: "/svg/stripe.svg" },
  shopify: { src: "/svg/shopify.svg" },
  slack: { src: "/svg/slack.svg" },
  cal: { src: "/svg/cal.svg" },
  calendar: { src: "/svg/calendly.svg", size: "large" },
  tavily: { src: "/svg/tavily.svg" },
  salesforce: { src: "/svg/salesforce.svg" },
};

const SVG_SIZE_CLASS = {
  default: "h-5 w-5 object-contain",
  large: "h-7 w-7 scale-[1.15] object-contain",
} as const;

const HUGEICONS: Partial<Record<ActionIconKey, typeof CodeIcon>> = {
  "user-group": UserGroupIcon,
  file: File01Icon,
  message: Message01Icon,
  sun: Sun01Icon,
  cursor: Cursor01Icon,
};

type ActionCatalogIconProps = {
  icon: ActionIconKey;
  className?: string;
  variant?: "default" | "muted";
};

export function ActionCatalogIcon({
  icon,
  className,
  variant = "default",
}: ActionCatalogIconProps) {
  const muted = variant === "muted";
  const plateClass = cn(
    muted
      ? "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-canvas-soft"
      : ICON_PLATE_CLASS,
    className,
  );
  const mediaMutedClass = muted ? "opacity-40 grayscale" : undefined;

  if (icon === "escalation-stack") {
    return <EscalationIconStack className={cn(className, mediaMutedClass)} />;
  }

  const svg = SVG_ICONS[icon];
  if (svg) {
    const sizeKey = svg.size ?? "default";
    const px = sizeKey === "large" ? 28 : 20;
    return (
      <span className={plateClass} aria-hidden>
        <Image
          src={svg.src}
          alt=""
          width={px}
          height={px}
          className={cn(SVG_SIZE_CLASS[sizeKey], mediaMutedClass)}
        />
      </span>
    );
  }

  const hugeicon = HUGEICONS[icon] ?? CodeIcon;
  return (
    <span
      className={cn(plateClass, muted ? "text-muted-soft" : "text-ink")}
      aria-hidden
    >
      <HugeiconsIcon icon={hugeicon} size={20} strokeWidth={1.75} />
    </span>
  );
}
