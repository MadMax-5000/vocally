import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import {
  AgentChannelType,
  AgentTone,
  AgentType,
  SupportedLanguage,
} from "@prisma/client";

import { CHANNEL_META } from "@/lib/constants/agent-channels";
import { formatRelativeCreated } from "@/lib/format/relative-created";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArabicFlag,
  DarijaFlag,
  EnglishFlag,
  FrenchFlag,
} from "@/utils/flags";

const BACKGROUND_IMAGES = [
  "/images/abstract1.png",
  "/images/abstract2.png",
  "/images/abstract3.jpeg",
  "/images/abtract4.png",
  "/images/abstract5.jpeg",
  "/images/abstract6.jpeg",
];

function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const LANGUAGE_ORDER: SupportedLanguage[] = [
  "ARABIC",
  "DARIJA",
  "FRENCH",
  "ENGLISH",
];

const LANGUAGE_FLAG: Record<
  SupportedLanguage,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  ARABIC: ArabicFlag,
  DARIJA: DarijaFlag,
  FRENCH: FrenchFlag,
  ENGLISH: EnglishFlag,
};

export type AgentCardData = {
  id: string;
  name: string;
  agentType: AgentType;
  tone: AgentTone;
  customRole: string | null;
  channels: { channel: AgentChannelType }[];
  languages: { language: SupportedLanguage }[];
  createdAt: Date;
};

type AgentStackedCardProps = {
  agent: AgentCardData;
  index: number;
};

export function AgentStackedCard({ agent, index }: AgentStackedCardProps) {
  const bgImage = BACKGROUND_IMAGES[index % BACKGROUND_IMAGES.length];

  const displayType =
    agent.agentType === "CUSTOM" && agent.customRole
      ? agent.customRole
      : humanizeEnum(agent.agentType);

  const displayTone = humanizeEnum(agent.tone);

  const enabledChannels = agent.channels
    .map((c) => CHANNEL_META.find((m) => m.value === c.channel))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  const selectedLanguages = new Set(
    agent.languages.map((entry) => entry.language),
  );
  const orderedLanguages = LANGUAGE_ORDER.filter((lang) =>
    selectedLanguages.has(lang),
  );

  return (
    <div
      className="relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-xxl shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-out hover:-translate-y-1"
      style={{
        minHeight: "150px",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transitionDelay: `${index * 45}ms`,
      }}
    >
      <Link
        href={`/dashboard/agents/${agent.id}`}
        aria-label={`Open agent ${agent.name}`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none relative z-20 m-1.5 flex flex-1 flex-col rounded-xxl bg-surface-card p-4 sm:p-5">
        {/* Header Row: Title & Channels */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-1">
            <div className="truncate font-display text-display-sm font-bold tracking-tight text-ink">
              {agent.name}
            </div>
            <span className="text-body-sm text-muted">
              {formatRelativeCreated(agent.createdAt)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2">
              {enabledChannels.length > 0 ? (
                enabledChannels.map((channel) => (
                  <Image
                    key={channel.value}
                    src={channel.iconSrc}
                    alt={channel.label}
                    title={channel.label}
                    width={18}
                    height={18}
                  />
                ))
              ) : (
                <span className="text-caption text-muted">No channels</span>
              )}
            </div>

            <div className="pointer-events-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Agent actions"
                    className="text-muted hover:text-ink"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/agents/${agent.id}`}>Open</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Pills Row */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-strong px-3 py-[2px] text-xs font-semibold text-body ring-1 ring-inset ring-hairline">
              {displayType}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-strong px-3 py-[2px] text-xs font-semibold text-body ring-1 ring-inset ring-hairline">
              {displayTone}
            </span>
          </div>
          {orderedLanguages.length > 0 ? (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {orderedLanguages.map((lang) => {
                const Flag = LANGUAGE_FLAG[lang];
                return (
                  <Flag
                    key={lang}
                    className="h-5 w-5 shrink-0"
                    aria-hidden
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer Strip (Image visible) */}
      <div className="h-none w-full" aria-hidden="true" />
    </div>
  );
}
