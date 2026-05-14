"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LiveSession } from "@/lib/actions/sessions";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CHANNEL_META: Record<string, { src: string; label: string }> = {
  VOICE:    { src: "/svg/call.svg",          label: "Voice" },
  CHAT:     { src: "/svg/chat.svg",          label: "Chat" },
  SMS:      { src: "/svg/send.svg",          label: "SMS" },
  WHATSAPP: { src: "/svg/whatsapp-icon.svg", label: "WhatsApp" },
  EMAIL:    { src: "/svg/gmail.svg",         label: "Email" },
};

const STATUS_CFG: Record<string, { label: string; pill: string }> = {
  ACTIVE:    { label: "Active",    pill: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  WAITING:   { label: "Waiting",   pill: "bg-amber-50 text-amber-800 ring-amber-100" },
  BOT:       { label: "Bot",       pill: "bg-slate-50 text-slate-700 ring-slate-200" },
  ESCALATED: { label: "Escalated", pill: "bg-red-50 text-red-700 ring-red-300" },
  CLAIMED:   { label: "Claimed",   pill: "bg-blue-50 text-blue-700 ring-blue-300" },
};

const STATUS_ORDER = ["ACTIVE", "BOT", "WAITING", "ESCALATED", "CLAIMED"];

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sentimentColor(score: number | null): string {
  if (score == null) return "text-muted-soft";
  if (score >= 0.3) return "text-emerald-600";
  if (score >= -0.3) return "text-amber-600";
  return "text-red-600";
}

export function LiveMonitorClient({
  initialSessions,
}: {
  initialSessions: LiveSession[];
}) {
  const [liveSessions, setLiveSessions] = React.useState(initialSessions);

  React.useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    function scheduleRefetch() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const { getLiveSessions } = await import("@/lib/actions/sessions");
        const res = await getLiveSessions();
        if (res.success) setLiveSessions(res.data);
      }, 2000);
    }

    const channel = supabase
      .channel("live-monitor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Session" },
        () => { scheduleRefetch(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(debounceTimer);
    };
  }, []);

  const grouped = React.useMemo(() => {
    const groups: Record<string, LiveSession[]> = {};
    for (const s of liveSessions) {
      const status = STATUS_ORDER.includes(s.status) ? s.status : "ACTIVE";
      if (!groups[status]) groups[status] = [];
      groups[status].push(s);
    }
    return groups;
  }, [liveSessions]);

  const totalActive = liveSessions.length;

  if (totalActive === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-display-sm tracking-tight text-ink">
            Live Monitor
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-card px-3 py-[3px] text-body-sm font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-soft" />
            0 active
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-card py-20">
          <RadioIcon />
          <p className="mt-4 text-body-md text-muted">No active sessions</p>
          <p className="mt-1 text-body-sm text-muted-soft">
            Live sessions from voice calls, chat, and other channels will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-sm tracking-tight text-ink">
          Live Monitor
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-card px-3 py-[3px] text-body-sm font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {totalActive} active
        </span>
      </div>

      <div className="space-y-4">
        {STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (!group || group.length === 0) return null;
          const cfg = STATUS_CFG[status];

          return (
            <div key={status} className="rounded-xl border border-hairline bg-surface-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-caption-uppercase font-semibold ring-1 ring-inset", cfg.pill)}>
                  {cfg.label}
                </span>
                <span className="text-caption text-muted">{group.length}</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-hairline">
                    <TableHead className="w-10" />
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Channel</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Customer</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Agent</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Duration</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Sentiment</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Last Activity</TableHead>
                    <TableHead className="text-caption-uppercase text-muted font-semibold">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.map((session) => (
                    <TableRow key={session.id} className="border-hairline">
                      <TableCell>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      </TableCell>
                      <TableCell>
                        <ChannelBadge channel={session.channel} />
                      </TableCell>
                      <TableCell className="text-body-sm text-ink font-medium">
                        {session.customerId ?? "—"}
                      </TableCell>
                      <TableCell className="text-body-sm text-body">
                        {session.agentName ?? "AI"}
                      </TableCell>
                      <TableCell className="text-body-sm text-body font-mono">
                        {formatDuration(session.duration)}
                      </TableCell>
                      <TableCell className={cn("text-body-sm font-medium", sentimentColor(session.sentiment))}>
                        {session.sentiment != null ? session.sentiment.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-body-sm text-muted font-mono">
                        {formatTime(session.startedAt)}
                      </TableCell>
                      <TableCell className="text-body-sm text-muted">
                        {session.messageCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel];
  if (!meta) return <span className="text-body-sm text-muted">{channel}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Image src={meta.src} alt={meta.label} width={16} height={16} className="shrink-0" />
      <span className="text-body-sm text-body">{meta.label}</span>
    </span>
  );
}

function RadioIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-soft"
    >
      <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" />
      <path d="M7.8 13.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <path d="M16.2 4.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 1.9c3.9 3.9 3.9 10.3 0 14.2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
