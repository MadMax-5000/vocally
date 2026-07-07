"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { Link } from "@/i18n/routing";

import { useLandingNav } from "./LandingNavContext";
import {
  NAV_CONTENT_SWITCH,
  NAV_PANEL_CLOSE,
  NAV_PANEL_OPEN,
  NAV_SPRING,
} from "./landing-nav-motion";
import {
  industrySection,
  recentUpdate,
  resourcesLinks,
  solutionsSections,
  type MegaId,
  type NavLinkItem,
} from "./landing-nav-data";

const container = "mx-auto w-full max-w-[1200px] px-6";

function NavIconPlate({ icon }: { icon: NavLinkItem["icon"] }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-strong">
      <AppIcon icon={icon} size={18} className="text-muted" />
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
      className="group flex gap-3 rounded-lg p-2 transition-colors duration-200 ease-out hover:bg-surface-strong/70"
    >
      <NavIconPlate icon={item.icon} />
      <span className="min-w-0 pt-0.5">
        <span className="block text-title-sm font-medium text-ink transition-colors duration-200 ease-out group-hover:text-body-strong">
          {t(item.titleKey)}
        </span>
        <span className="mt-0.5 block text-body-sm text-muted">{t(item.descriptionKey)}</span>
      </span>
    </Link>
  );
}

function SectionLabel({ labelKey }: { labelKey: string }) {
  const t = useTranslations("landing.nav");
  return <div className="px-2 text-caption-uppercase text-muted">{t(labelKey)}</div>;
}

function SolutionsContent() {
  return (
    <div className="grid gap-6 p-2 md:grid-cols-[1fr_auto_1fr] md:gap-0">
      <div className="space-y-6">
        {solutionsSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <SectionLabel labelKey={section.labelKey} />
            <div className="space-y-1">
              {section.items.map((item) => (
                <MegaLink key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-px bg-hairline md:block" aria-hidden />

      <div className="space-y-2 md:ps-2">
        <SectionLabel labelKey={industrySection.labelKey} />
        <div className="space-y-1">
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
    <div className="grid gap-4 p-2 md:grid-cols-2 md:gap-6">
      <div className="space-y-2">
        <SectionLabel labelKey="sections.quickLinks" />
        <div className="space-y-1">
          {resourcesLinks.map((item) => (
            <MegaLink key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-surface-strong p-4">
        <SectionLabel labelKey="sections.recentUpdate" />
        <Link
          href={recentUpdate.href}
          onClick={closeMega}
          className="group mt-3 block overflow-hidden rounded-xl border border-hairline bg-surface-card transition-[box-shadow,background-color] duration-300 ease-out hover:bg-canvas-soft hover:shadow-[0_4px_20px_rgba(12,10,9,0.05)]"
        >
          <div className="relative flex h-28 items-center justify-between overflow-hidden bg-primary px-5">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 16px)",
              }}
              aria-hidden
            />
            <span className="relative font-display text-display-sm tracking-tight text-on-primary">
              anselio
            </span>
            <span className="relative rounded-md bg-on-primary/15 px-2 py-1 text-caption-uppercase text-on-primary backdrop-blur-sm">
              {t(recentUpdate.badgeKey)}
            </span>
          </div>
          <div className="space-y-2 bg-ink px-4 py-3">
            <p className="text-title-sm font-medium text-on-primary">{t(recentUpdate.titleKey)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-body-sm text-muted">{t(recentUpdate.descriptionKey)}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function MegaPanelContent({ activeMega }: { activeMega: MegaId }) {
  return activeMega === "solutions" ? <SolutionsContent /> : <ResourcesContent />;
}

function useSwitchDirection(activeMega: MegaId | null) {
  const previous = useRef<MegaId | null>(null);
  const [direction, setDirection] = useState(0);

  useLayoutEffect(() => {
    if (activeMega && previous.current && activeMega !== previous.current) {
      setDirection(
        activeMega === "resources" && previous.current === "solutions" ? 1 : -1,
      );
    } else {
      setDirection(0);
    }
    previous.current = activeMega;
  }, [activeMega]);

  return direction;
}

export function LandingNavMegaPanel() {
  const { activeMega, cancelClose, scheduleClose } = useLandingNav();
  const shouldReduceMotion = useReducedMotion();
  const measureRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const switchDirection = useSwitchDirection(activeMega);
  const isOpen = activeMega !== null;

  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node || !activeMega) return;

    const update = () => {
      setHeight(node.getBoundingClientRect().height);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeMega]);

  const shellTransition: Transition = shouldReduceMotion
    ? { duration: 0.01 }
    : NAV_PANEL_OPEN;

  const shellCloseTransition: Transition = shouldReduceMotion
    ? { duration: 0.01 }
    : NAV_PANEL_CLOSE;

  const heightTransition: Transition = shouldReduceMotion
    ? { duration: 0.01 }
    : NAV_SPRING;

  const contentTransition: Transition = shouldReduceMotion
    ? { duration: 0.01 }
    : NAV_CONTENT_SWITCH;

  return (
    <div
      className={[
        "absolute inset-x-0 top-full z-50 hidden lg:block",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className={[container, "pointer-events-none pt-2"].join(" ")}>
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key="mega-shell"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, transition: shellCloseTransition }
              }
              transition={shellTransition}
              className="pointer-events-auto overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-[0_8px_30px_rgba(12,10,9,0.06)] will-change-[opacity,transform]"
            >
              <motion.div
                animate={{ height: height || "auto" }}
                transition={heightTransition}
                className="overflow-hidden"
              >
                <div className="relative">
                  {/* Invisible sizer drives smooth height — no layout scale */}
                  <div
                    ref={measureRef}
                    className="pointer-events-none invisible p-4"
                    aria-hidden
                  >
                    <MegaPanelContent activeMega={activeMega!} />
                  </div>

                  {/* Overlapping crossfade layer */}
                  <div className="absolute inset-0 p-4">
                    <AnimatePresence initial={false} mode="sync">
                      <motion.div
                        key={activeMega}
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : {
                                opacity: 0,
                                x: switchDirection * 12,
                                y: switchDirection === 0 ? 4 : 0,
                              }
                        }
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : {
                                opacity: 0,
                                x: switchDirection * -8,
                                y: 0,
                              }
                        }
                        transition={contentTransition}
                        className="w-full will-change-[opacity,transform]"
                      >
                        <MegaPanelContent activeMega={activeMega!} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
