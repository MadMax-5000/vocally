"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export const landingNavLinks = [
  { id: "pricing", href: "/pricing", labelKey: "labels.pricing" },
  { id: "features", href: "/#features", labelKey: "labels.features" },
  { id: "solutions", href: "/#solutions", labelKey: "labels.solutions" },
] as const;

export function LandingNavDesktop({ tone = "default" }: { tone?: "default" | "overlay" }) {
  const t = useTranslations("landing.nav");
  const overlay = tone === "overlay";

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1">
      {landingNavLinks.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-[15px] font-medium leading-none transition-colors duration-150 ease-out",
            overlay ? "text-white/80 hover:text-white" : "text-ink/70 hover:text-ink",
          )}
        >
          {t(link.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
