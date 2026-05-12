"use client";

import * as React from "react";
import Image from "next/image";
import { Inbox, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxSession } from "@/lib/actions/sessions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ConversationDetailSheet } from "./ConversationDetailSheet";

/* ------------------------------------------------------------------
   Constants & helpers
   ------------------------------------------------------------------ */

const CHANNEL_META: Record<string, { src: string; label: string }> = {
  VOICE: { src: "/svg/call.svg", label: "Voice" },
  CHAT: { src: "/svg/chat.svg", label: "Chat" },
  SMS: { src: "/svg/send.svg", label: "SMS" },
  WHATSAPP: { src: "/svg/whatsapp-icon.svg", label: "WhatsApp" },
  EMAIL: { src: "/svg/gmail.svg", label: "Email" },
};

const CHANNELS = ["VOICE", "CHAT", "SMS", "WHATSAPP", "EMAIL"] as const;

const USER_NONE = "__USER_NONE__";
const AGENT_AI = "__AGENT_AI__";

const STATUS_CFG: Record<string, { label: string; pill: string }> = {
  ACTIVE: { label: "Active", pill: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  WAITING: { label: "Waiting", pill: "bg-amber-50 text-amber-800 ring-amber-100" },
  BOT: { label: "Bot", pill: "bg-slate-50 text-slate-700 ring-slate-200" },
  HUMAN: { label: "Human", pill: "bg-violet-50 text-violet-700 ring-violet-100" },
  RESOLVED: { label: "Resolved", pill: "bg-slate-50 text-slate-700 ring-slate-200" },
  ABANDONED: { label: "Abandoned", pill: "bg-rose-50 text-rose-700 ring-rose-100" },
};

const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++)
    h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function agentInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function parseLocalYMD(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatSessionDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDurationDisplay(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const meta = CHANNEL_META[channel];
  if (!meta) return null;
  return (
    <Image
      src={meta.src}
      alt={meta.label}
      title={meta.label}
      width={16}
      height={16}
      className={cn("shrink-0", className)}
    />
  );
}

const CHIP_TRIGGER =
  "h-6 shrink-0 rounded-md border border-hairline bg-surface-card px-2 text-xs font-medium shadow-none transition-colors";

/* ------------------------------------------------------------------
   Filter chips
   ------------------------------------------------------------------ */

function CompactDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string | null; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const activeOption =
    value !== null ? options.find((o) => o.value === value) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            CHIP_TRIGGER,
            activeOption
              ? "text-ink hover:bg-canvas-soft"
              : "text-muted hover:bg-canvas-soft hover:text-body",
          )}
        >
          {activeOption ? (
            activeOption.label
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-muted-soft">+</span>
              {label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[10rem] rounded-xl border-hairline bg-surface-card"
      >
        {options.map((opt) => (
          <DropdownMenuItem
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-body-sm",
              value === opt.value && "bg-surface-strong font-medium",
            )}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateFilterChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const active = value !== null;

  const date = value ? parseLocalYMD(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            CHIP_TRIGGER,
            active
              ? "text-ink hover:bg-canvas-soft"
              : "text-muted hover:bg-canvas-soft hover:text-body",
          )}
        >
          {active && date ? (
            format(date, "MMM d, yyyy")
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-muted-soft">+</span>
              {label}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-xl border-hairline bg-surface-card p-0"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${day}`);
              setOpen(false);
            }
          }}
        />
        {active && (
          <div className="border-t border-hairline p-2">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full rounded-md px-2 py-1 text-left text-body-sm text-muted hover:bg-surface-strong"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DisabledFilterChip({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className={cn(
              CHIP_TRIGGER,
              "cursor-not-allowed rounded-md opacity-50 text-muted",
            )}
          >
            <span className="flex items-center gap-1">
              <span className="text-muted-soft">+</span>
              {label}
            </span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">Not available yet</TooltipContent>
    </Tooltip>
  );
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/* ------------------------------------------------------------------
   InboxClient
   ------------------------------------------------------------------ */

export function InboxClient({ sessions }: { sessions: InboxSession[] }) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [search, setSearch] = React.useState("");
  const [dateAfter, setDateAfter] = React.useState<string | null>(null);
  const [dateBefore, setDateBefore] = React.useState<string | null>(null);
  const [channelFilter, setChannelFilter] = React.useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = React.useState<string | null>(
    null,
  );
  const [userFilter, setUserFilter] = React.useState<string | null>(null);
  const [agentFilter, setAgentFilter] = React.useState<string | null>(null);
  const [durationFilter, setDurationFilter] = React.useState<string | null>(
    null,
  );
  const [ratingFilter, setRatingFilter] = React.useState<string | null>(null);
  const [criteriaFilter, setCriteriaFilter] = React.useState<string | null>(
    null,
  );
  const [dataFilter, setDataFilter] = React.useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetSessionId, setSheetSessionId] = React.useState<string | null>(
    null,
  );

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function clearAllFilters() {
    setSearch("");
    setDateAfter(null);
    setDateBefore(null);
    setChannelFilter(null);
    setStatusFilter(null);
    setLanguageFilter(null);
    setUserFilter(null);
    setAgentFilter(null);
    setDurationFilter(null);
    setRatingFilter(null);
    setCriteriaFilter(null);
    setDataFilter(null);
  }

  const filteredSessions = React.useMemo(() => {
    let list = sessions.filter((s) => s.agentName);

    if (dateAfter) {
      const start = parseLocalYMD(dateAfter);
      start.setHours(0, 0, 0, 0);
      list = list.filter((s) => s.createdAt >= start);
    }
    if (dateBefore) {
      const end = parseLocalYMD(dateBefore);
      end.setHours(23, 59, 59, 999);
      list = list.filter((s) => s.createdAt <= end);
    }
    if (channelFilter) {
      list = list.filter((s) => s.channel === channelFilter);
    }
    if (statusFilter) {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (languageFilter) {
      list = list.filter((s) => s.language === languageFilter);
    }
    if (userFilter === USER_NONE) {
      list = list.filter((s) => !s.customerId);
    } else if (userFilter) {
      list = list.filter((s) => s.customerId === userFilter);
    }
    if (agentFilter === AGENT_AI) {
      list = list.filter((s) => !s.agentName);
    } else if (agentFilter) {
      list = list.filter((s) => s.agentName === agentFilter);
    }
    if (durationFilter === "lt1") {
      list = list.filter(
        (s) => s.duration != null && s.duration > 0 && s.duration < 60,
      );
    } else if (durationFilter === "1_10") {
      list = list.filter(
        (s) => s.duration != null && s.duration >= 60 && s.duration <= 600,
      );
    } else if (durationFilter === "gt10") {
      list = list.filter((s) => s.duration != null && s.duration > 600);
    } else if (durationFilter === "none") {
      list = list.filter((s) => s.duration == null);
    }
    if (ratingFilter === "high") {
      list = list.filter((s) => s.qaScore != null && s.qaScore >= 80);
    } else if (ratingFilter === "mid") {
      list = list.filter(
        (s) => s.qaScore != null && s.qaScore >= 50 && s.qaScore < 80,
      );
    } else if (ratingFilter === "low") {
      list = list.filter((s) => s.qaScore != null && s.qaScore < 50);
    } else if (ratingFilter === "norating") {
      list = list.filter((s) => s.qaScore == null);
    }
    if (criteriaFilter === "ai") {
      list = list.filter((s) => s.resolvedByAI === true);
    } else if (criteriaFilter === "not_ai") {
      list = list.filter((s) => s.resolvedByAI === false);
    }
    if (dataFilter === "has") {
      list = list.filter(
        (s) => s.recordingUrl != null && s.recordingUrl.length > 0,
      );
    } else if (dataFilter === "no") {
      list = list.filter((s) => !s.recordingUrl);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.customerId ?? "").toLowerCase().includes(q) ||
          (s.summary ?? "").toLowerCase().includes(q) ||
          (s.lastMessage?.content ?? "").toLowerCase().includes(q) ||
          (s.agentName ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [
    sessions,
    dateAfter,
    dateBefore,
    channelFilter,
    statusFilter,
    languageFilter,
    userFilter,
    agentFilter,
    durationFilter,
    ratingFilter,
    criteriaFilter,
    dataFilter,
    search,
  ]);

  function handleRowClick(sessionId: string) {
    setSheetSessionId(sessionId);
    setSheetOpen(true);
  }

  const channelOptions = React.useMemo(
    () => [
      { value: null, label: "All channels" },
      ...CHANNELS.map((ch) => ({
        value: ch,
        label: CHANNEL_META[ch]?.label ?? ch,
      })),
    ],
    [],
  );

  const statusOptions = React.useMemo(
    () => [
      { value: null, label: "All statuses" },
      ...Object.entries(STATUS_CFG).map(([key, cfg]) => ({
        value: key,
        label: cfg.label,
      })),
    ],
    [],
  );

  const languageOptions = React.useMemo(() => {
    const langs = uniqSorted(sessions.map((s) => s.language).filter(Boolean));
    return [
      { value: null, label: "All languages" },
      ...langs.map((lang) => ({ value: lang, label: lang })),
    ];
  }, [sessions]);

  const userOptions = React.useMemo(() => {
    const ids = uniqSorted(
      sessions
        .map((s) => s.customerId)
        .filter((id): id is string => id != null && id.length > 0),
    );
    return [
      { value: null, label: "All users" },
      { value: USER_NONE, label: "Unidentified" },
      ...ids.map((id) => ({ value: id, label: id })),
    ];
  }, [sessions]);

  const agentOptions = React.useMemo(() => {
    const names = uniqSorted(
      sessions
        .map((s) => s.agentName)
        .filter((n): n is string => n != null && n.length > 0),
    );
    return [
      { value: null, label: "All agents" },
      { value: AGENT_AI, label: "Unassigned" },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [sessions]);

  const durationOptions = React.useMemo(
    () => [
      { value: null, label: "Any duration" },
      { value: "lt1", label: "Under 1 min" },
      { value: "1_10", label: "1–10 min" },
      { value: "gt10", label: "Over 10 min" },
      { value: "none", label: "No duration" },
    ],
    [],
  );

  const ratingOptions = React.useMemo(
    () => [
      { value: null, label: "Any rating" },
      { value: "high", label: "80+" },
      { value: "mid", label: "50–79" },
      { value: "low", label: "Under 50" },
      { value: "norating", label: "No rating" },
    ],
    [],
  );

  const criteriaOptions = React.useMemo(
    () => [
      { value: null, label: "All outcomes" },
      { value: "ai", label: "Resolved by AI" },
      { value: "not_ai", label: "Not resolved by AI" },
    ],
    [],
  );

  const dataOptions = React.useMemo(
    () => [
      { value: null, label: "All" },
      { value: "has", label: "Has recording" },
      { value: "no", label: "No recording" },
    ],
    [],
  );

  const pageHeader = (
    <div className="shrink-0">
      <h1 className="text-display-sm font-display tracking-tight text-ink">
        Conversation history
      </h1>
    </div>
  );

  /* ── Empty state (no sessions at all) ──────────────────── */
  if (sessions.length === 0) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6">
          {pageHeader}
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-hairline bg-surface-card">
              <Inbox className="h-6 w-6 text-ink" strokeWidth={1.5} />
            </div>
            <h2 className="text-title-sm font-medium text-ink">
              No conversations yet
            </h2>
            <p className="mt-1 max-w-sm text-body-sm text-muted">
              When customers reach out, their threads will show up in your
              conversation history here.
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6">
        {pageHeader}

        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            ref={searchInputRef}
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border-hairline pl-8 pr-16 text-sm text-ink placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-ink/10"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            <kbd className="rounded border border-hairline bg-surface-strong px-1.5 py-0.5 font-sans text-[11px] leading-none text-muted">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Filter strip */}
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
            <DateFilterChip
              label="Date After"
              value={dateAfter}
              onChange={setDateAfter}
            />
            <DateFilterChip
              label="Date Before"
              value={dateBefore}
              onChange={setDateBefore}
            />
            <CompactDropdown
              label="Call status"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <CompactDropdown
              label="Criteria"
              options={criteriaOptions}
              value={criteriaFilter}
              onChange={setCriteriaFilter}
            />
            <CompactDropdown
              label="Data"
              options={dataOptions}
              value={dataFilter}
              onChange={setDataFilter}
            />
            <CompactDropdown
              label="Duration"
              options={durationOptions}
              value={durationFilter}
              onChange={setDurationFilter}
            />
            <CompactDropdown
              label="Rating"
              options={ratingOptions}
              value={ratingFilter}
              onChange={setRatingFilter}
            />
                <CompactDropdown
                  label="Agent"
                  options={agentOptions}
                  value={agentFilter}
                  onChange={setAgentFilter}
                />
            <CompactDropdown
              label="Language"
              options={languageOptions}
              value={languageFilter}
              onChange={setLanguageFilter}
            />
            <CompactDropdown
              label="User"
              options={userOptions}
              value={userFilter}
              onChange={setUserFilter}
            />
            <CompactDropdown
              label="Channel"
              options={channelOptions}
              value={channelFilter}
              onChange={setChannelFilter}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-6 w-7 shrink-0 rounded-md border-hairline bg-surface-card shadow-none"
                aria-label="Filter actions"
              >
                <SlidersHorizontal className="h-4 w-4 text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-hairline bg-surface-card"
            >
              <DropdownMenuItem
                className="text-body-sm"
                onClick={clearAllFilters}
              >
                Clear all filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-caption text-muted">
          {filteredSessions.length} conversation
          {filteredSessions.length !== 1 ? "s" : ""}
        </p>

        {/* Table */}
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="mb-3 h-6 w-6 text-muted-soft" />
            <p className="text-body-sm text-muted">
              No matching conversations
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-2 text-body-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-0 pr-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Agent
                </TableHead>
                <TableHead className="px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Title
                </TableHead>
                <TableHead className="w-[128px] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Date
                </TableHead>
                <TableHead className="w-[72px] px-3 py-1 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Duration
                </TableHead>
                <TableHead className="w-[72px] px-3 py-1 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Messages
                </TableHead>
                <TableHead className="w-[100px] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                      {filteredSessions.map((s) => {
                        const statusCfg =
                          STATUS_CFG[s.status] ?? {
                            label: s.status,
                            pill: "bg-slate-50 text-slate-700 ring-slate-200",
                          };
                        const title =
                          s.summary ??
                          s.lastMessage?.content?.slice(0, 60) ??
                          "No messages";
                        const titleTruncated =
                          (s.summary ?? s.lastMessage?.content ?? "").length >
                          60;
                        const displayAgent = s.agentName ?? "Unassigned";

                        return (
                          <TableRow
                            key={s.id}
                            className="group cursor-pointer border-0 transition-colors duration-200 hover:bg-surface-strong/40"
                            onClick={() => handleRowClick(s.id)}
                          >
                            <TableCell className="py-1.5 pl-0 pr-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
                                    s.agentName
                                      ? hashColor(s.agentName)
                                      : "bg-surface-strong text-muted",
                                  )}
                                >
                                  {s.agentName
                                    ? agentInitials(s.agentName)
                                    : "—"}
                                </div>
                                <span className="truncate text-body-sm font-medium text-ink">
                                  {displayAgent}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-[260px] px-3 py-1.5">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <ChannelIcon
                                  channel={s.channel}
                                  className="h-3.5 w-3.5 shrink-0 text-muted"
                                />
                                <p className="truncate text-body-sm font-medium text-ink">
                                  {title}
                                  {titleTruncated ? "…" : ""}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="px-3 py-1.5">
                              <span
                                className="whitespace-nowrap text-xs text-muted"
                                title={s.createdAt.toISOString()}
                              >
                                {formatSessionDate(s.createdAt)}
                              </span>
                            </TableCell>

                            <TableCell className="px-3 py-1.5 text-right">
                              <span className="tabular-nums text-xs text-muted">
                                {formatDurationDisplay(s.duration)}
                              </span>
                            </TableCell>

                            <TableCell className="px-3 py-1.5 text-right">
                              <span className="tabular-nums text-xs text-muted">
                                {s.messageCount}
                              </span>
                            </TableCell>

                            <TableCell className="px-3 py-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-3 py-[2px] text-xs font-semibold ring-1 ring-inset",
                                  statusCfg.pill,
                                )}
                              >
                                {statusCfg.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

        <ConversationDetailSheet
          sessionId={sheetSessionId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </TooltipProvider>
  );
}
