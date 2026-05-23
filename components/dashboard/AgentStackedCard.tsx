"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  AgentChannelType,
  AgentStatus,
  AgentTone,
  AgentType,
  SupportedLanguage,
} from "@prisma/client";
import { archiveAgent, deleteAgent, duplicateAgent } from "@/lib/actions/agents";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarAgentAvatar } from "@/components/dashboard/sidebar/SidebarAgentAvatar";
import {
  ArabicFlag,
  DarijaFlag,
  EnglishFlag,
  FrenchFlag,
} from "@/utils/flags";

const CARD_AVATAR_SIZE = 36;

const LANGUAGE_ORDER: SupportedLanguage[] = [
  "ARABIC",
  "DARIJA",
  "FRENCH",
  "ENGLISH",
];

const LANGUAGE_FLAG: Record<SupportedLanguage, ComponentType<SVGProps<SVGSVGElement>>> = {
  ARABIC: ArabicFlag,
  DARIJA: DarijaFlag,
  FRENCH: FrenchFlag,
  ENGLISH: EnglishFlag,
};

const LANGUAGE_LABEL: Record<SupportedLanguage, string> = {
  ARABIC: "Arabic",
  DARIJA: "Darija",
  FRENCH: "French",
  ENGLISH: "English",
};

function humanizeEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type AgentCardData = {
  id: string;
  name: string;
  agentType: AgentType;
  tone: AgentTone;
  customRole: string | null;
  status: AgentStatus;
  channels: { channel: AgentChannelType }[];
  languages: { language: SupportedLanguage }[];
  createdAt: Date;
};

function AgentAvatarWithStatus({
  agentId,
  status,
}: {
  agentId: string;
  status: AgentStatus;
}) {
  const showActiveDot = status === "ACTIVE";

  return (
    <div
      className="relative shrink-0"
      style={{ width: CARD_AVATAR_SIZE, height: CARD_AVATAR_SIZE }}
    >
      <SidebarAgentAvatar agentId={agentId} size={CARD_AVATAR_SIZE} />
      {showActiveDot ? (
        <span
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-emerald-500"
          aria-label="Active"
        />
      ) : null}
    </div>
  );
}

type AgentActionsMenuProps = {
  agent: AgentCardData;
};

function AgentActionsMenu({ agent }: AgentActionsMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Agent actions"
          className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted transition-all hover:bg-surface-strong hover:text-ink"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/agents/${agent.id}`}>Open</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const res = await duplicateAgent(agent.id);
            if (res.success) {
              toast.success("Agent duplicated");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to duplicate");
            }
          }}
        >
          Duplicate Agent
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const res = await archiveAgent(agent.id);
            if (res.success) {
              toast.success(res.status === "PAUSED" ? "Agent archived" : "Agent unarchived");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to archive");
            }
          }}
        >
          {agent.status === "PAUSED" ? "Unarchive Agent" : "Archive Agent"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            const confirmed = window.confirm(
              `Are you sure you want to delete "${agent.name}"? This cannot be undone.`,
            );
            if (!confirmed) return;
            const res = await deleteAgent(agent.id);
            if (res.success) {
              toast.success("Agent deleted");
              router.refresh();
            } else {
              toast.error(res.error ?? "Failed to delete");
            }
          }}
          className="text-semantic-error focus:text-semantic-error"
        >
          Delete Agent
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="pointer-events-none px-2 py-1.5 text-caption text-muted-soft">
          {formatRelativeCreated(agent.createdAt)}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type AgentStackedCardProps = {
  agent: AgentCardData;
  index: number;
};

export function AgentStackedCard({ agent, index }: AgentStackedCardProps) {
  const router = useRouter();

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

  const hasChannels = enabledChannels.length > 0;
  const hasLanguages = orderedLanguages.length > 0;

  return (
    <div
      className="group flex cursor-pointer flex-col rounded-xl border border-hairline bg-surface-card p-4 transition-all duration-200 hover:border-hairline-strong/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      <div className="flex items-start gap-3">
        <AgentAvatarWithStatus agentId={agent.id} status={agent.status} />

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate font-display text-title-sm tracking-tight text-ink transition-colors group-hover:text-ink/90">
            {agent.name}
          </h3>
          <p className="mt-0.5 truncate text-body-sm text-muted">
            {displayType} · {displayTone}
          </p>
        </div>

        <AgentActionsMenu agent={agent} />
      </div>

      {hasChannels || hasLanguages ? (
        <div className="mt-3 flex items-center justify-between border-t border-hairline-soft pt-3">
          {hasChannels ? (
            <div className="flex items-center gap-1.5">
              {enabledChannels.map((channel) => (
                <Tooltip key={channel.value}>
                  <TooltipTrigger asChild>
                    <div
                      className="group/icon flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-surface-card transition-transform hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Image
                        src={channel.iconSrc}
                        alt={channel.label}
                        width={14}
                        height={14}
                        className="rounded-[2px] grayscale opacity-50 transition-all duration-200 group-hover/icon:grayscale-0 group-hover/icon:opacity-100"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{channel.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <span className="text-caption text-muted">No channels</span>
          )}

          {hasLanguages ? (
            <div className="ml-auto flex items-center gap-1.5">
              {orderedLanguages.map((lang) => {
                const Flag = LANGUAGE_FLAG[lang];
                const label = LANGUAGE_LABEL[lang];
                return (
                  <Tooltip key={lang}>
                    <TooltipTrigger asChild>
                      <div
                        className="group/icon flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-card transition-transform hover:scale-105"
                        onClick={(e) => e.stopPropagation()}
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
      ) : (
        <p className="mt-3 border-t border-hairline-soft pt-3 text-caption text-muted">
          No channels
        </p>
      )}
    </div>
  );
}

type AgentCardGridProps = {
  agents: AgentCardData[];
};

export function AgentCardGrid({ agents }: AgentCardGridProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent, index) => (
          <AgentStackedCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </TooltipProvider>
  );
}
