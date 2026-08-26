"use client";

import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { ChevronDown } from "@/lib/icons/app-icons";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { useLandingNav } from "./LandingNavContext";
import { EASE_OUT } from "./landing-nav-motion";
import { plainNavLinks, type MegaId } from "./landing-nav-data";

function MegaTrigger({ id, label }: { id: MegaId; label: string }) {
  const { activeMega, isOpen, openMega, scheduleClose } = useLandingNav();
  const isActive = isOpen && activeMega === id;

  return (
    <button
      type="button"
      aria-haspopup="true"
      aria-expanded={isActive}
      onMouseEnter={() => openMega(id)}
      onFocus={() => openMega(id)}
      onBlur={scheduleClose}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md px-3 text-nav-link leading-none transition-colors duration-150 ease-out",
        isActive ? "text-ink" : "text-ink/70 hover:text-ink",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex text-muted transition-transform duration-200",
          isActive && "rotate-180",
        )}
        style={{ transitionTimingFunction: `cubic-bezier(${EASE_OUT.join(",")})` }}
        aria-hidden
      >
        <AppIcon icon={ChevronDown} size={13} strokeWidth={2} />
      </span>
    </button>
  );
}

export function LandingNavDesktop() {
  const t = useTranslations("landing.nav");
  const { cancelClose, scheduleClose } = useLandingNav();

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-1"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <MegaTrigger id="solutions" label={t("labels.solutions")} />
      <MegaTrigger id="resources" label={t("labels.resources")} />

      {plainNavLinks.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className="inline-flex h-8 items-center rounded-md px-3 text-nav-link leading-none text-ink/70 transition-colors duration-150 ease-out hover:text-ink"
        >
          {t(`labels.${link.labelKey}`)}
        </Link>
      ))}
    </nav>
  );
}
