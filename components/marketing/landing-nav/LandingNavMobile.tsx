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

function MobileAccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-title-sm font-medium text-ink"
        aria-expanded={open}
      >
        {title}
        <AppIcon
          icon={ChevronDown}
          size={16}
          className={cn(
            "text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="space-y-4 pb-4">{children}</div> : null}
    </div>
  );
}

function MobileSectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-caption-uppercase text-muted">{children}</div>;
}

function MobileLink({
  href,
  title,
  description,
  onNavigate,
}: {
  href: string;
  title: string;
  description?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-lg px-2 py-2 transition-colors hover:bg-surface-strong"
    >
      <span className="block text-title-sm font-medium text-ink">{title}</span>
      {description ? (
        <span className="mt-0.5 block text-body-sm text-muted">{description}</span>
      ) : null}
    </Link>
  );
}

export function LandingNavMobile() {
  const t = useTranslations("landing.nav");
  const [sheetOpen, setSheetOpen] = useState(false);

  function closeSheet() {
    setSheetOpen(false);
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface-card text-ink transition-colors hover:bg-surface-strong lg:hidden"
          aria-label={t("labels.menu")}
        >
          <AppIcon icon={PanelLeft} size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="top" className="max-h-[85dvh] overflow-y-auto bg-canvas px-6 pb-8 pt-12">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("labels.menu")}</SheetTitle>
        </SheetHeader>

        <MobileAccordionSection title={t("labels.solutions")} defaultOpen>
          {solutionsSections.map((section) => (
            <div key={section.id} className="space-y-2">
              <MobileSectionLabel>{t(section.labelKey)}</MobileSectionLabel>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <MobileLink
                    key={item.id}
                    href={item.href}
                    title={t(item.titleKey)}
                    description={t(item.descriptionKey)}
                    onNavigate={closeSheet}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <MobileSectionLabel>{t(industrySection.labelKey)}</MobileSectionLabel>
            <div className="space-y-1">
              {industrySection.items.map((item) => (
                <MobileLink
                  key={item.id}
                  href={item.href}
                  title={t(item.titleKey)}
                  description={t(item.descriptionKey)}
                  onNavigate={closeSheet}
                />
              ))}
            </div>
          </div>
        </MobileAccordionSection>

        <MobileAccordionSection title={t("labels.resources")}>
          <div className="space-y-2">
            <MobileSectionLabel>{t("sections.quickLinks")}</MobileSectionLabel>
            <div className="space-y-1">
              {resourcesLinks.map((item) => (
                <MobileLink
                  key={item.id}
                  href={item.href}
                  title={t(item.titleKey)}
                  description={t(item.descriptionKey)}
                  onNavigate={closeSheet}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <MobileSectionLabel>{t("sections.recentUpdate")}</MobileSectionLabel>
            <MobileLink
              href={recentUpdate.href}
              title={t(recentUpdate.titleKey)}
              description={t(recentUpdate.descriptionKey)}
              onNavigate={closeSheet}
            />
          </div>
        </MobileAccordionSection>

        <div className="space-y-1 pt-2">
          {plainNavLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={closeSheet}
              className="block rounded-lg px-2 py-3 text-title-sm font-medium text-ink transition-colors hover:bg-surface-strong"
            >
              {t(`labels.${link.labelKey}`)}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
