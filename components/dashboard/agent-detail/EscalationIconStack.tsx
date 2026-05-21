import Image from "next/image";

import { cn } from "@/lib/utils";

const ESCALATION_LOGOS = [
  { src: "/svg/zendesk.svg", alt: "Zendesk" },
  { src: "/svg/salesforce.svg", alt: "Salesforce" },
  { src: "/svg/intercom.svg", alt: "Intercom" },
  { src: "/svg/help-scout.svg", alt: "Help Scout" },
  { src: "/svg/hubspot.svg", alt: "HubSpot" },
  { src: "/svg/freshdesk.svg", alt: "Freshdesk" },
] as const;

export function EscalationIconStack({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)} aria-hidden>
      {ESCALATION_LOGOS.map((logo, index) => (
        <div
          key={logo.src}
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-card p-0.5",
            index > 0 && "-ml-2.5"
          )}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
        </div>
      ))}
    </div>
  );
}
