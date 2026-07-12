"use client";

import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { AgentChannelType, SupportedLanguage } from "@prisma/client";

import { CHANNEL_META } from "@/lib/constants/agent-channels";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArabicFlag,
  DarijaFlag,
  EnglishFlag,
  FrenchFlag,
} from "@/utils/flags";

export const CARD_AVATAR_SIZE = 36;

export const LANGUAGE_ORDER: SupportedLanguage[] = [
  "ARABIC",
  "DARIJA",
  "FRENCH",
  "ENGLISH",
];

export const LANGUAGE_FLAG: Record<
  SupportedLanguage,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  ARABIC: ArabicFlag,
  DARIJA: DarijaFlag,
  FRENCH: FrenchFlag,
  ENGLISH: EnglishFlag,
};

function enumTranslationKey(value: string) {
  return value.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

type AgentCardMetaFooterProps = {
  channelTypes: AgentChannelType[];
  languages: SupportedLanguage[];
  stopPropagation?: boolean;
};

export function AgentCardMetaFooter({
  channelTypes,
  languages,
  stopPropagation = false,
}: AgentCardMetaFooterProps) {
  const t = useTranslations("dashboard.agents");
  const enabledChannels = channelTypes
    .map((channel) => CHANNEL_META.find((m) => m.value === channel))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  const selectedLanguages = new Set(languages);
  const orderedLanguages = LANGUAGE_ORDER.filter((lang) =>
    selectedLanguages.has(lang),
  );

  const hasChannels = enabledChannels.length > 0;
  const hasLanguages = orderedLanguages.length > 0;

  const handleIconClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  if (!hasChannels && !hasLanguages) {
    return (
      <p className="mt-3 border-t border-hairline-soft pt-3 text-caption text-muted">
        {t("noChannels")}
      </p>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline-soft pt-3">
      {hasChannels ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {enabledChannels.map((channel) => (
            <Tooltip key={channel.value}>
              <TooltipTrigger asChild>
                <div
                  className="group/icon flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-surface-card transition-transform hover:scale-105"
                  onClick={handleIconClick}
                >
                  <Image
                    src={channel.iconSrc}
                    alt={t(`channels.${enumTranslationKey(channel.value)}`)}
                    width={14}
                    height={14}
                    className="rounded-[2px] grayscale opacity-50 transition-all duration-200 group-hover/icon:grayscale-0 group-hover/icon:opacity-100"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">{t(`channels.${enumTranslationKey(channel.value)}`)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : (
        <span className="text-caption text-muted">{t("noChannels")}</span>
      )}

      {hasLanguages ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {orderedLanguages.map((lang) => {
            const Flag = LANGUAGE_FLAG[lang];
            const label = t(lang.toLowerCase());
            return (
              <Tooltip key={lang}>
                <TooltipTrigger asChild>
                  <div
                    className="group/icon flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-card transition-transform hover:scale-105"
                    onClick={handleIconClick}
                  >
                    <Flag
                      className="h-4 w-4 grayscale opacity-50 transition-all duration-200 group-hover/icon:grayscale-0 group-hover/icon:opacity-100"
                      aria-hidden
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
