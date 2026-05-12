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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArabicFlag,
  DarijaFlag,
  EnglishFlag,
  FrenchFlag,
} from "@/utils/flags";

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

const LANGUAGE_FLAG: Record<SupportedLanguage, ComponentType<SVGProps<SVGSVGElement>>> = {
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
  status: AgentStatus;
  channels: { channel: AgentChannelType }[];
  languages: { language: SupportedLanguage }[];
  createdAt: Date;
};

// ─── Row ────────────────────────────────────────────────────────────────────

type AgentTableRowProps = {
  agent: AgentCardData;
  index: number;
};

function formatCreatedAt(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AgentTableRow({ agent, index }: AgentTableRowProps) {
  const router = useRouter();

  const enabledChannels = agent.channels
    .map((c) => CHANNEL_META.find((m) => m.value === c.channel))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  return (
    <TableRow
      className="group cursor-pointer border-0 transition-colors duration-200 hover:bg-surface-strong/40"
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      {/* Name */}
      <TableCell className="py-1 pl-0">
        <span className="text-body-sm font-medium text-ink">
          {agent.name}
        </span>
      </TableCell>

      {/* Created at */}
      <TableCell className="py-1">
        <span className="text-body-sm text-muted">
          {formatCreatedAt(agent.createdAt)}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-1">
        <span
          className={`inline-flex items-center rounded-full px-3 py-[2px] text-xs font-semibold ring-1 ring-inset ${
            agent.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : agent.status === "PAUSED"
                ? "bg-amber-50 text-amber-800 ring-amber-100"
                : "bg-slate-50 text-slate-700 ring-slate-200"
          }`}
        >
          {agent.status.charAt(0) + agent.status.slice(1).toLowerCase()}
        </span>
      </TableCell>

      {/* Channels */}
      <TableCell className="py-1">
        {enabledChannels.length > 0 ? (
          <div className="flex -space-x-1.5">
            {enabledChannels.map((channel, i) => (
              <div
                key={channel.value}
                className="relative flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface-card shadow-sm transition-transform group-hover:scale-105"
                style={{ zIndex: enabledChannels.length - i }}
              >
                <Image
                  src={channel.iconSrc}
                  alt={channel.label}
                  title={channel.label}
                  width={12}
                  height={12}
                  className="rounded-[2px]"
                />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-body-sm text-muted">No channels</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="py-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Agent actions"
              className="h-8 w-8 text-muted transition-all hover:bg-surface-strong hover:text-ink"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

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

  return (
    <div
      className="group w-full cursor-pointer rounded-xl border border-hairline bg-surface-card p-4 transition-all duration-200 hover:border-hairline/80 hover:shadow-sm"
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-title-sm tracking-tight text-ink transition-colors group-hover:text-ink/90">
            {agent.name}
          </span>
          <span className="text-xs text-muted">
            Created {formatRelativeCreated(agent.createdAt)}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Agent actions"
              className="h-8 w-8 text-muted transition-all hover:bg-surface-strong hover:text-ink"
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-md bg-surface-strong/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-body ring-1 ring-inset ring-hairline">
          {displayType}
        </span>
        <span className="inline-flex items-center rounded-md bg-surface-strong/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-body ring-1 ring-inset ring-hairline">
          {displayTone}
        </span>
      </div>

      {/* Channels + Languages */}
      <div className="mt-3 flex items-center justify-between">
        {enabledChannels.length > 0 ? (
          <div className="flex -space-x-1.5">
            {enabledChannels.map((channel, i) => (
              <div
                key={channel.value}
                className="relative flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-surface-card shadow-sm transition-transform group-hover:scale-105"
                style={{ zIndex: enabledChannels.length - i }}
              >
                <Image
                  src={channel.iconSrc}
                  alt={channel.label}
                  title={channel.label}
                  width={12}
                  height={12}
                  className="rounded-[2px]"
                />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-muted">No channels</span>
        )}

        {orderedLanguages.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {orderedLanguages.map((lang) => {
              const Flag = LANGUAGE_FLAG[lang];
              return (
                <div
                  key={lang}
                  className="flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline/50 transition-transform group-hover:scale-105"
                  title={lang}
                >
                  <Flag className="h-full w-full object-cover" aria-hidden />
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-muted">—</span>
        )}
      </div>
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

type AgentTableProps = {
  agents: AgentCardData[];
};

export function AgentTable({ agents }: AgentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-0 text-xs font-medium uppercase tracking-wider text-muted">
            Name
          </TableHead>
          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted">
            Created at
          </TableHead>
          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted">
            Status
          </TableHead>
          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted">
            Channels
          </TableHead>
          <TableHead className="w-[44px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent, index) => (
          <AgentTableRow key={agent.id} agent={agent} index={index} />
        ))}
      </TableBody>
    </Table>
  );
}