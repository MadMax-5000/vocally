"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon, MessageCircle, SendIcon, Handshake } from "@/lib/icons/app-icons"

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

import { buildTriggerLabels } from "@/lib/ai/escalation-service";
import { cn } from "@/lib/utils";
import type { ConversationDetail, InboxMessage } from "@/lib/actions/sessions";
import { getConversationDetail, sendMessage, claimSession, updateSessionSummary } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { VoiceCallView } from "./VoiceCallView";

/* ------------------------------------------------------------------
   Channel metadata (shared with InboxClient)
   ------------------------------------------------------------------ */

const CHANNEL_META: Record<string, { src: string; labelKey: string }> = {
  VOICE:    { src: "/svg/call.svg",          labelKey: "channels.voice" },
  CHAT:     { src: "/svg/chat.svg",          labelKey: "channels.chat" },
  SMS:      { src: "/svg/send.svg",          labelKey: "channels.sms" },
  WHATSAPP: { src: "/svg/whatsapp-icon.svg", labelKey: "channels.whatsApp" },
  EMAIL:    { src: "/svg/gmail.svg",         labelKey: "channels.email" },
};

const STATUS_CFG: Record<string, { dot: string; labelKey: string }> = {
  ACTIVE:    { dot: "bg-emerald-500", labelKey: "statuses.active" },
  WAITING:   { dot: "bg-amber-400",   labelKey: "statuses.waiting" },
  BOT:       { dot: "bg-blue-400",    labelKey: "statuses.bot" },
  HUMAN:     { dot: "bg-violet-400",  labelKey: "statuses.human" },
  ESCALATED: { dot: "bg-red-500",     labelKey: "statuses.escalated" },
  CLAIMED:   { dot: "bg-blue-500",    labelKey: "statuses.claimed" },
  RESOLVED:  { dot: "bg-gray-300",    labelKey: "statuses.resolved" },
  ABANDONED: { dot: "bg-red-400",     labelKey: "statuses.abandoned" },
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

function getInitials(
  customerId: string | null | undefined,
  channel: string,
): string {
  if (customerId) {
    const parts = customerId.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : customerId.slice(0, 2).toUpperCase();
  }
  return (channel ?? "??").slice(0, 2).toUpperCase();
}

function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const t = useTranslations("dashboard.inbox");
  const meta = CHANNEL_META[channel];
  if (!meta) return null;
  return (
    <Image
      src={meta.src}
      alt={t(meta.labelKey)}
      title={t(meta.labelKey)}
      width={16}
      height={16}
      className={cn("shrink-0", className)}
    />
  );
}

function formatFullDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function formatDateLabel(date: Date, locale: string, today: string, yesterday: string): string {
  if (isToday(date)) return today;
  if (isYesterday(date)) return yesterday;
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/* ------------------------------------------------------------------
   ChatMessagesView — message bubbles for text channels
   ------------------------------------------------------------------ */

function ChatMessagesView({ messages }: { messages: InboxMessage[] }) {
  const t = useTranslations("dashboard.inbox");
  const locale = useLocale();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const groups = React.useMemo(() => {
    if (messages.length === 0) return [];
    const g: { date: Date; messages: InboxMessage[] }[] = [];
    let current: { date: Date; messages: InboxMessage[] } | null = null;
    for (const m of messages) {
      if (!current || !isSameDay(current.date, m.createdAt)) {
        current = { date: m.createdAt, messages: [] };
        g.push(current);
      }
      current.messages.push(m);
    }
    return g;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong">
          <AppIcon icon={MessageCircle} className="h-5 w-5 text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-body-sm text-muted">{t("noMessagesYet")}</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <React.Fragment key={group.date.toISOString()}>
          <div className="flex items-center gap-3 px-5 py-2">
            <div className="flex-1 border-t border-hairline" />
            <span className="shrink-0 text-[11px] font-medium text-muted-soft">
              {formatDateLabel(group.date, locale, t("today"), t("yesterday"))}
            </span>
            <div className="flex-1 border-t border-hairline" />
          </div>
          {group.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </React.Fragment>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const locale = useLocale();
  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";

  if (isSystem) {
    return (
      <div className="flex justify-center py-1.5 px-5">
        <span className="rounded-full bg-surface-strong px-3 py-1 text-[11px] text-muted">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex px-5 py-1", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] px-3.5 py-2.5",
          isUser
            ? "bg-ink text-canvas rounded-2xl rounded-br-md"
            : "bg-surface-strong text-ink rounded-2xl rounded-bl-md",
        )}
      >
        <div className="text-[13px] leading-relaxed">
          <ChatMarkdown
            content={message.content}
            variant={isUser ? "userInk" : "assistant"}
          />
        </div>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isUser ? "text-white/40" : "text-muted-soft",
          )}
        >
          {formatFullDate(message.createdAt, locale)}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   EmailView — email detail
   ------------------------------------------------------------------ */

function EmailView({ detail }: { detail: ConversationDetail }) {
  const t = useTranslations("dashboard.inbox");
  const firstMessage = detail.messages[0];
  const customerLabel = detail.customerId ?? t("customer");

  return (
    <div className="rounded-xl border border-hairline bg-surface-card">
      {/* Header */}
      <div className="border-b border-hairline px-4 py-3 space-y-1">
        {firstMessage && (
          <div className="text-body-sm text-muted">
            <span className="text-muted-soft">{t("from")} </span>
            <span className="text-ink">{customerLabel}</span>
          </div>
        )}
        <div className="text-body-sm text-muted">
          <span className="text-muted-soft">{t("emailChannel")} </span>
          <span className="text-ink">{t("channels.email")}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {detail.summary && (
          <div className="rounded-lg bg-canvas-soft px-3 py-2 text-body-sm text-muted">
            <span className="font-medium text-ink">{t("summary")} </span>
            <ChatMarkdown content={detail.summary} variant="neutral" />
          </div>
        )}
        {detail.messages.length === 0 && (
          <p className="text-body-sm text-muted-soft">{t("noEmailContent")}</p>
        )}
        {detail.messages.map((m) => (
          <div key={m.id} className="text-body-sm text-ink leading-relaxed">
            <span className="text-[11px] font-medium text-muted-soft uppercase">
              {m.role}:
            </span>
            <div className="mt-0.5">
              <ChatMarkdown content={m.content} variant="neutral" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   LoadingSkeleton
   ------------------------------------------------------------------ */

function LoadingSkeleton() {
  const t = useTranslations("dashboard.inbox");
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AppIcon icon={LoaderIcon} className="h-6 w-6 animate-spin text-muted" />
      <p className="mt-3 text-body-sm text-muted">{t("loadingConversation")}</p>
    </div>
  );
}

/* ------------------------------------------------------------------
   ConversationDetailSheet
   ------------------------------------------------------------------ */

type ConversationDetailSheetProps = {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConversationDetailSheet({
  sessionId,
  open,
  onOpenChange,
}: ConversationDetailSheetProps) {
  const t = useTranslations("dashboard.inbox");
  const locale = useLocale();
  const [detail, setDetail] = React.useState<ConversationDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [claiming, setClaiming] = React.useState(false);
  const [claimError, setClaimError] = React.useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = React.useState(false);
  const [editedSummary, setEditedSummary] = React.useState("");
  const [savingSummary, setSavingSummary] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setDetail(null);
      setMessages([]);
      setClaimError(null);
      return;
    }
    if (!sessionId) return;

    setLoading(true);
    getConversationDetail(sessionId).then((res) => {
      if (res.success) {
        setDetail(res.data);
        setMessages(res.data.messages);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, open]);

  const isTextChannel =
    detail?.channel === "CHAT" ||
    detail?.channel === "SMS" ||
    detail?.channel === "WHATSAPP";

  const isVoice = detail?.channel === "VOICE";

  const isEscalated = detail?.status === "ESCALATED";
  const isClaimed = detail?.status === "CLAIMED";

  const canReply = isClaimed && isTextChannel;

  async function handleClaim() {
    if (!sessionId || claiming) return;
    setClaiming(true);
    setClaimError(null);
    const res = await claimSession(sessionId);
    if (res.success) {
      setDetail((prev) => (prev ? { ...prev, status: "CLAIMED" } : prev));
    } else {
      setClaimError(res.error);
    }
    setClaiming(false);
  }

  async function handleSaveSummary() {
    if (!sessionId || savingSummary) return;
    setSavingSummary(true);
    const res = await updateSessionSummary(sessionId, editedSummary.trim());
    if (res.success) {
      setDetail((prev) =>
        prev ? { ...prev, summary: editedSummary.trim() } : prev,
      );
      setIsEditingSummary(false);
    }
    setSavingSummary(false);
  }

  function handleStartEdit() {
    setEditedSummary(detail?.summary ?? "");
    setIsEditingSummary(true);
  }

  function handleCancelEdit() {
    setIsEditingSummary(false);
    setEditedSummary("");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !sessionId || sending) return;
    setSending(true);
    const res = await sendMessage(sessionId, replyText.trim());
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setReplyText("");
    }
    setSending(false);
  }

  const displayName =
    detail?.customerId ??
    (detail?.channel ? t(CHANNEL_META[detail.channel]?.labelKey ?? "conversation") : null) ??
    t("conversation");

  const statusCfg = detail?.status
    ? STATUS_CFG[detail.status] ?? { dot: "bg-gray-300", labelKey: "" }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-2xl p-0"
      >
        {/* ── Sheet header ─────────────────────────────────── */}
        <SheetHeader className="shrink-0 border-b border-hairline px-5 py-4 pr-12 text-left">
          {detail && !loading ? (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold shrink-0",
                    hashColor(detail.id),
                  )}
                >
                  {getInitials(detail.customerId, detail.channel)}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-body-sm">
                    {displayName}
                  </SheetTitle>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-soft mt-0.5">
                    <ChannelIcon channel={detail.channel} className="h-3 w-3 opacity-60" />
                    <span>{CHANNEL_META[detail.channel] ? t(CHANNEL_META[detail.channel].labelKey) : detail.channel}</span>
                    {statusCfg && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.labelKey ? t(statusCfg.labelKey) : detail.status}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatFullDate(detail.createdAt, locale)}</span>
                  </div>
                </div>
              </div>
              {detail.agentName && (
                <SheetDescription className="pt-1.5 text-[11px]">
                  {t("agentLabel")} {detail.agentName}
                </SheetDescription>
              )}
            </>
          ) : (
            <>
              <SheetTitle className="text-body-sm">{t("conversation")}</SheetTitle>
              <SheetDescription className="text-[11px]">
                {loading ? t("loadingConversation") : ""}
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {detail && !loading && (isEscalated || detail.ticket) ? (
          <div className="shrink-0 space-y-2 border-b border-hairline px-5 py-3">
            {isEscalated && detail.escalatedReason ? (
              <p className="text-body-sm text-muted">
                {t("escalationReason")}{" "}
                <span className="text-ink">
                  {buildTriggerLabels()[detail.escalatedReason] ??
                    detail.escalatedReason}
                </span>
              </p>
            ) : null}
            {detail.ticket ? (
              <div className="rounded-xl border border-hairline bg-surface-strong px-3 py-2.5">
                <p className="text-caption-uppercase text-muted">{t("supportTicket")}</p>
                <p className="mt-1 text-body-sm font-medium text-ink">
                  {detail.ticket.subject}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-caption text-muted">
                  <span className="rounded-full bg-surface-card px-2 py-0.5 ring-1 ring-inset ring-hairline">
                    {detail.ticket.priority}
                  </span>
                  <span className="rounded-full bg-surface-card px-2 py-0.5 ring-1 ring-inset ring-hairline">
                    {detail.ticket.status}
                  </span>
                  <span>#{detail.ticket.id.slice(0, 8)}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Scrollable content ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-5">
              <p className="text-body-sm text-muted">{t("couldNotLoadConversation")}</p>
            </div>
          ) : isVoice ? (
            <div className="p-5">
              <VoiceCallView
                recordingUrl={detail.recordingUrl}
                transcript={detail.transcript}
                summary={detail.summary}
                duration={detail.duration}
                sentiment={detail.sentiment}
                qaScore={detail.qaScore}
              />
            </div>
          ) : detail.channel === "EMAIL" ? (
            <div className="p-5">
              <EmailView detail={detail} />
            </div>
          ) : (
            <div className="py-3">
              <ChatMessagesView messages={messages} />
            </div>
          )}

          {/* ── Editable Summary ─────────────────────────── */}
          {detail && (
            <div className="border-t border-hairline px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-caption-uppercase text-muted">{t("summary")}</h3>
                {!isEditingSummary && detail.summary && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    {t("edit")}
                  </button>
                )}
              </div>

              {isEditingSummary ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-hairline bg-surface-strong px-3 py-2 text-body-sm text-ink placeholder:text-muted-soft outline-none focus:border-primary transition-colors"
                    placeholder={t("editSummary")}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveSummary}
                      disabled={savingSummary || !editedSummary.trim()}
                      className="rounded-lg"
                    >
                      {savingSummary ? t("saving") : t("save")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={savingSummary}
                      className="rounded-lg"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : detail.summary ? (
                <p className="text-body-sm text-ink leading-relaxed">
                  {detail.summary}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-body-sm text-muted-soft">{t("noSummaryYet")}</p>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    {t("addSummary")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Claim button (ESCALATED sessions) ──────────── */}
        {isEscalated && detail && (
          <div className="shrink-0 border-t border-hairline bg-surface-card px-5 py-4">
            {claimError && (
              <p className="mb-2 text-body-sm text-red-600">{claimError}</p>
            )}
            <Button
              type="button"
              variant="primary"
              size="default"
              onClick={handleClaim}
              disabled={claiming}
              className="w-full rounded-xl"
            >
              {claiming ? (
                <AppIcon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AppIcon icon={Handshake} className="mr-2 h-4 w-4" />
              )}
              {t("claimConversation")}
            </Button>
          </div>
        )}

        {/* ── Reply area (CLAIMED + text channels) ───────── */}
        {canReply && detail && (
          <div className="shrink-0 border-t border-hairline bg-surface-card px-5 py-4">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                placeholder={t("typeReply")}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="h-10 flex-1 rounded-xl border-hairline bg-surface-strong pl-4 text-body-sm placeholder:text-muted-soft"
                disabled={sending}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!replyText.trim() || sending}
                className="h-10 w-10 shrink-0 rounded-xl p-0"
              >
                <AppIcon icon={SendIcon} className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
