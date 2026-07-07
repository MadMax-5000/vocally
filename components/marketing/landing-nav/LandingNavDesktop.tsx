"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { ChevronDown } from "@/lib/icons/app-icons";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { useLandingNav } from "./LandingNavContext";
import { NAV_SPRING_SNAPPY } from "./landing-nav-motion";
import { plainNavLinks, type MegaId } from "./landing-nav-data";

function MegaTrigger({ id, label }: { id: MegaId; label: string }) {
  const { activeMega, openMega } = useLandingNav();
  const isActive = activeMega === id;

  return (
    <button
      type="button"
      aria-haspopup="true"
      aria-expanded={isActive}
      onMouseEnter={() => openMega(id)}
      onFocus={() => openMega(id)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-nav-link transition-colors duration-200 ease-out",
        isActive ? "text-ink" : "text-ink hover:text-body-strong",
      )}
    >
      {label}
      <motion.span
        animate={{ rotate: isActive ? 180 : 0 }}
        transition={NAV_SPRING_SNAPPY}
        className="inline-flex"
      >
        <AppIcon icon={ChevronDown} size={14} className="text-muted" />
      </motion.span>
    </button>
  );
}

export function LandingNavDesktop() {
  const t = useTranslations("landing.nav");
  const { cancelClose, scheduleClose } = useLandingNav();

  return (
    <nav
      aria-label="Main"
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
          className="rounded-md px-2.5 py-1.5 text-nav-link text-ink transition-colors duration-200 ease-out hover:text-body-strong"
        >
          {t(`labels.${link.labelKey}`)}
        </Link>
      ))}
    </nav>
  );
}
