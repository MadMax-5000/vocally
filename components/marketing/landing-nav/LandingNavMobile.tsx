"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { PanelLeft } from "@/lib/icons/app-icons";
import { Link } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BookDemoLink } from "@/components/marketing/BookDemoLink";
import { cn } from "@/lib/utils";

const navLinks = [
  { id: "pricing", href: "/pricing", labelKey: "labels.pricing" },
  { id: "features", href: "/#features", labelKey: "labels.features" },
  { id: "solutions", href: "/#solutions", labelKey: "labels.solutions" },
] as const;

export function LandingNavMobile({ tone = "default" }: { tone?: "default" | "overlay" }) {
  const t = useTranslations("landing.nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const overlay = tone === "overlay";

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("labels.menu")}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors lg:hidden",
            overlay
              ? "border border-white/25 bg-white/5 text-white hover:bg-white/10"
              : "border border-hairline bg-surface-card text-ink hover:bg-surface-strong",
          )}
        >
          <AppIcon icon={PanelLeft} size={17} strokeWidth={1.75} />
        </button>
      </SheetTrigger>

      <SheetContent side="top" className="max-h-[80dvh] overflow-y-auto px-6 pb-8 pt-14">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("labels.menu")}</SheetTitle>
        </SheetHeader>

        <nav aria-label="Main navigation" className="flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={close}
              className="border-b border-hairline py-4 text-[17px] font-medium text-ink transition-colors hover:text-body"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <BookDemoLink className="inline-flex py-2 text-[15px] font-medium text-primary transition-colors hover:text-primary-active">
            {tc("bookDemo")}
          </BookDemoLink>
        </div>
      </SheetContent>
    </Sheet>
  );
}
