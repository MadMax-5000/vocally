"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { ChevronDown, PanelLeft } from "@/lib/icons/app-icons";
import { Link } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  industrySection,
  plainNavLinks,
  recentUpdate,
  resourcesLinks,
  solutionsSections,
} from "./landing-nav-data";

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-[15px] font-medium text-ink"
      >
        {title}
        <AppIcon
          icon={ChevronDown}
          size={16}
          strokeWidth={2}
          className={cn(
            "text-muted transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="space-y-5 pb-5">{children}</div> : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-caption-uppercase text-muted">{children}</p>
  );
}

function MobileNavLink({
  href,
  title,
  description,
  onClose,
}: {
  href: string;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-strong"
    >
      <span className="block text-[14px] font-medium text-ink">{title}</span>
      {description ? (
        <span className="mt-0.5 block text-body-sm text-muted">{description}</span>
      ) : null}
    </Link>
  );
}

export function LandingNavMobile() {
  const t = useTranslations("landing.nav");
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("labels.menu")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface-card text-ink transition-colors hover:bg-surface-strong lg:hidden"
        >
          <AppIcon icon={PanelLeft} size={17} strokeWidth={1.75} />
        </button>
      </SheetTrigger>

      <SheetContent side="top" className="max-h-[80dvh] overflow-y-auto px-6 pb-8 pt-14">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("labels.menu")}</SheetTitle>
        </SheetHeader>

        {/* Solutions accordion */}
        <AccordionSection title={t("labels.solutions")} defaultOpen>
          {solutionsSections.map((section) => (
            <div key={section.id}>
              <SectionLabel>{t(section.labelKey)}</SectionLabel>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <MobileNavLink
                    key={item.id}
                    href={item.href}
                    title={t(item.titleKey)}
                    description={t(item.descriptionKey)}
                    onClose={close}
                  />
                ))}
              </div>
            </div>
          ))}
          <div>
            <SectionLabel>{t(industrySection.labelKey)}</SectionLabel>
            <div className="space-y-0.5">
              {industrySection.items.map((item) => (
                <MobileNavLink
                  key={item.id}
                  href={item.href}
                  title={t(item.titleKey)}
                  description={t(item.descriptionKey)}
                  onClose={close}
                />
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* Resources accordion */}
        <AccordionSection title={t("labels.resources")}>
          <div>
            <SectionLabel>{t("sections.quickLinks")}</SectionLabel>
            <div className="space-y-0.5">
              {resourcesLinks.map((item) => (
                <MobileNavLink
                  key={item.id}
                  href={item.href}
                  title={t(item.titleKey)}
                  description={t(item.descriptionKey)}
                  onClose={close}
                />
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>{t("sections.recentUpdate")}</SectionLabel>
            <MobileNavLink
              href={recentUpdate.href}
              title={t(recentUpdate.titleKey)}
              description={t(recentUpdate.descriptionKey)}
              onClose={close}
            />
          </div>
        </AccordionSection>

        {/* Plain links */}
        <div className="space-y-0.5 pt-3">
          {plainNavLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={close}
              className="block rounded-lg px-2 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-surface-strong"
            >
              {t(`labels.${link.labelKey}`)}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
