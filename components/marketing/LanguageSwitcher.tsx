"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { ArabicFlag, EnglishFlag, FrenchFlag } from "@/utils/flags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon } from "@/lib/icons/app-icons";
import { useTransition } from "react";

const flags = {
  fr: { icon: FrenchFlag, label: "Français" },
  ar: { icon: ArabicFlag, label: "العربية" },
  en: { icon: EnglishFlag, label: "English" },
} as const;

type LocaleKey = keyof typeof flags;

export function LanguageSwitcher() {
  const locale = useLocale() as LocaleKey;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const CurrentFlag = flags[locale]?.icon || FrenchFlag;

  function handleSwitch(newLocale: LocaleKey) {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-10 items-center justify-center rounded-md border border-hairline bg-surface-card transition-colors hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2"
        aria-label="Change language"
        disabled={isPending}
      >
        <CurrentFlag className="h-5 w-5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[140px]">
        {Object.entries(flags).map(([key, config]) => {
          const isSelected = key === locale;
          const FlagIcon = config.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleSwitch(key as LocaleKey)}
              className="flex cursor-pointer items-center gap-3"
            >
              <FlagIcon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-sm font-medium" dir={key === "ar" ? "rtl" : "ltr"}>
                {config.label}
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
