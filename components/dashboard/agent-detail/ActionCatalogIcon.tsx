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
  Record<ActionIconKey, { src: string; alt: string; size?: "default" | "large" }>
> = {
  api: { src: "/svg/api.svg", alt: "Custom API" },
  stripe: { src: "/svg/stripe.svg", alt: "Stripe" },
  shopify: { src: "/svg/shopify.svg", alt: "Shopify" },
  slack: { src: "/svg/slack.svg", alt: "Slack" },
  cal: { src: "/svg/cal.svg", alt: "Cal" },
  calendar: { src: "/svg/calendly.svg", alt: "Calendly", size: "large" },
  tavily: { src: "/svg/tavily.svg", alt: "Tavily" },
  salesforce: { src: "/svg/salesforce.svg", alt: "Salesforce" },
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
};

export function ActionCatalogIcon({ icon, className }: ActionCatalogIconProps) {
  if (icon === "escalation-stack") {
    return <EscalationIconStack className={className} />;
  }

  const svg = SVG_ICONS[icon];
  if (svg) {
    const sizeKey = svg.size ?? "default";
    const px = sizeKey === "large" ? 28 : 20;
    return (
      <span className={cn(ICON_PLATE_CLASS, className)} aria-hidden>
        <Image
          src={svg.src}
          alt={svg.alt}
          width={px}
          height={px}
          className={SVG_SIZE_CLASS[sizeKey]}
        />
      </span>
    );
  }

  const hugeicon = HUGEICONS[icon] ?? CodeIcon;
  return (
    <span className={cn(ICON_PLATE_CLASS, "text-ink", className)} aria-hidden>
      <HugeiconsIcon icon={hugeicon} size={20} strokeWidth={1.75} />
    </span>
  );
}
