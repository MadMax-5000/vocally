"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { Link } from "@/i18n/routing";

import { useLandingNav } from "./LandingNavContext";
import {
  CONTENT_SWAP,
  HEIGHT_MORPH,
  PANEL_CLOSE,
  PANEL_OPEN,
  SLIDE_AMPLITUDE,
} from "./landing-nav-motion";
import {
  industrySection,
  recentUpdate,
  resourcesLinks,
  solutionsSections,
  type NavLinkItem,
} from "./landing-nav-data";

const container = "mx-auto w-full max-w-[1200px] px-6";

// ─── Shared sub-components ───────────────────────────────────────────────────

function IconPlate({ icon }: { icon: NavLinkItem["icon"] }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-strong transition-colors duration-150 group-hover:border-hairline-strong">
      <AppIcon icon={icon} size={17} strokeWidth={1.5} className="text-body" />
    </span>
  );
}

function MegaLink({ item }: { item: NavLinkItem }) {
  const t = useTranslations("landing.nav");
  const { closeMega } = useLandingNav();

  return (
    <Link
      href={item.href}
      onClick={closeMega}
      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-150 ease-out hover:bg-surface-strong/70"
    >
      <IconPlate icon={item.icon} />
      <span className="min-w-0">
        <span className="block text-[14px] font-medium leading-tight text-ink">
          {t(item.titleKey)}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-muted">
          {t(item.descriptionKey)}
        </span>
      </span>
    </Link>
  );
}

function SectionHeader({ labelKey }: { labelKey: string }) {
  const t = useTranslations("landing.nav");
  return (
    <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
      {t(labelKey)}
    </p>
  );
}

// ─── Panel contents ───────────────────────────────────────────────────────────

function SolutionsContent() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] p-3">
      {/* Left column */}
      <div className="space-y-6 pe-5">
        {solutionsSections.map((section) => (
          <div key={section.id}>
            <SectionHeader labelKey={section.labelKey} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <MegaLink key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="bg-hairline" aria-hidden />

      {/* Right column */}
      <div className="ps-5">
        <SectionHeader labelKey={industrySection.labelKey} />
        <div className="space-y-0.5">
          {industrySection.items.map((item) => (
            <MegaLink key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResourcesContent() {
  const t = useTranslations("landing.nav");
  const { closeMega } = useLandingNav();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,0.9fr)] p-3">
      {/* Left column: quick links */}
      <div className="pe-5">
        <SectionHeader labelKey="sections.quickLinks" />
        <div className="space-y-0.5">
          {resourcesLinks.map((item) => (
            <MegaLink key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="bg-hairline" aria-hidden />

      {/* Right column: recent update */}
      <div className="ps-5">
        <SectionHeader labelKey="sections.recentUpdate" />
        <Link
          href={recentUpdate.href}
          onClick={closeMega}
          className="group mx-2.5 block overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-[0_1px_2px_rgba(12,10,9,0.04)] transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(12,10,9,0.08)]"
        >
          {/* Gradient hero strip */}
          <div className="relative flex h-[92px] items-center justify-between overflow-hidden bg-gradient-to-br from-primary to-primary-active px-4">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 11px, rgba(255,255,255,0.09) 11px, rgba(255,255,255,0.09) 22px)",
              }}
              aria-hidden
            />
            <span className="relative font-display text-[18px] tracking-tight text-on-primary">
              anselio
            </span>
            <span className="relative rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-primary backdrop-blur-sm">
              {t(recentUpdate.badgeKey)}
            </span>
          </div>
          {/* Title + description */}
          <div className="px-4 py-3.5">
            <p className="text-[13px] font-medium leading-snug text-ink">
              {t(recentUpdate.titleKey)}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              {t(recentUpdate.descriptionKey)}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function LandingNavMegaPanel() {
  const { isOpen, activeMega, direction, cancelClose, scheduleClose } = useLandingNav();
  const reduced = useReducedMotion();

  // Measure the active content's natural height so the container can animate
  // its real `height` (no layout-transform scaling / distortion).
  const measureRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (measureRef.current) {
      setHeight(measureRef.current.offsetHeight);
    }
  }, [activeMega]);

  const slide = reduced ? 0 : SLIDE_AMPLITUDE;

  const contentVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * slide }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -slide }),
  };

  return (
    <div
      className={[
        "absolute inset-x-0 top-full z-40 hidden lg:block",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className={[container, "flex justify-center"].join(" ")}>
        <div className="w-[660px] max-w-full">
        {/* Invisible hover bridge between triggers and panel */}
        <div className="h-2.5" aria-hidden />

        <AnimatePresence initial={false}>
          {isOpen && activeMega ? (
            <motion.div
              key="shell"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              transition={isOpen ? PANEL_OPEN : PANEL_CLOSE}
              className="w-full overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-[0_16px_48px_-8px_rgba(12,10,9,0.12)]"
            >
              {/* Real-height morph — smooth, no distortion, no push-down */}
              <motion.div
                animate={{ height: height ?? "auto" }}
                transition={reduced ? { duration: 0 } : HEIGHT_MORPH}
                style={{ overflow: "hidden" }}
              >
                {/* popLayout keeps the exiting panel out of flow so the two
                    never stack — they overlap and crossfade instead. */}
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                  custom={direction}
                >
                  <motion.div
                    key={activeMega}
                    ref={measureRef}
                    custom={direction}
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={reduced ? { duration: 0 } : CONTENT_SWAP}
                  >
                    {activeMega === "solutions" ? (
                      <SolutionsContent />
                    ) : (
                      <ResourcesContent />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
