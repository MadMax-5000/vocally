"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon } from "@/lib/icons/app-icons";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

const LOCALES = ["fr", "en", "ar"] as const;

const LABELS: Record<(typeof LOCALES)[number], string> = {
  fr: "FR",
  en: "EN",
  ar: "AR",
};

type LocaleKey = (typeof LOCALES)[number];

type LanguageSwitcherProps = {
  tone?: "default" | "overlay";
  className?: string;
};

export function LanguageSwitcher({ tone = "default", className }: LanguageSwitcherProps) {
  const overlay = tone === "overlay";
  const locale = useLocale() as LocaleKey;
  const t = useTranslations("dashboard.topbar");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentLabel = LABELS[locale] ?? LABELS.fr;

  function handleSwitch(newLocale: LocaleKey) {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 min-w-10 items-center justify-center px-3 text-caption-uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          overlay
            ? "rounded-full border border-white/25 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white/50 focus-visible:ring-offset-transparent"
            : "rounded-md border border-hairline bg-surface-card text-ink hover:bg-surface-strong focus-visible:ring-hairline-strong",
          className,
        )}
        aria-label={t("language")}
        disabled={isPending}
      >
        {currentLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[5.5rem]">
        {LOCALES.map((key) => {
          const isSelected = key === locale;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleSwitch(key)}
              className="flex cursor-pointer items-center gap-3"
            >
              <span className="flex-1 text-caption-uppercase text-ink">
                {LABELS[key]}
              </span>
              {isSelected && (
                <AppIcon icon={CheckIcon} className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
