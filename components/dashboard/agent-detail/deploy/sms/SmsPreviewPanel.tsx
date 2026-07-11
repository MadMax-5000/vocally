"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type SmsPreviewPanelProps = {
  businessName: string;
};

function Bubble({
  side,
  children,
}: {
  side: "in" | "out";
  children: React.ReactNode;
}) {
  const locale = useLocale();

  return (
    <div className={cn("flex", side === "in" ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-[12px] leading-snug",
          side === "in"
            ? "rounded-bl-sm bg-surface-card text-ink shadow-sm"
            : "rounded-br-sm bg-emerald-500 text-white",
        )}
      >
        {children}
        <p
          className={cn(
            "mt-0.5 text-[10px]",
            side === "in" ? "text-muted-soft" : "text-white/70",
          )}
        >
          {new Intl.DateTimeFormat(locale, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).format(new Date())}
        </p>
      </div>
    </div>
  );
}

export function SmsPreviewPanel({
  businessName,
}: SmsPreviewPanelProps) {
  const t = useTranslations("dashboard.deploy.messaging.sms.preview");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">{t("title")}</h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80 p-6">
          <div className="flex h-full max-h-full w-auto flex-col overflow-hidden rounded-[36px] border-4 border-ink/10 bg-surface-card shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]" style={{ aspectRatio: '9 / 16' }}>
            <div className="flex items-center gap-2 bg-canvas-soft px-5 py-4">
              <div className="flex size-3 gap-1">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-green-500/80" />
              </div>
              <div className="ml-2 text-caption font-medium text-muted">{t("messagesLabel")}</div>
              <div className="ml-auto text-caption text-muted-soft">{businessName}</div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#F2F2F7] p-3">
              <p className="mx-auto w-fit rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
                {t("today")}
              </p>
              <Bubble side="in">
                {t("messages.supportQuestion")}
              </Bubble>
              <Bubble side="out">
                {t("messages.supportReply")}
              </Bubble>

            </div>

            <div className="flex items-center gap-2 border-t border-hairline bg-canvas-soft px-3 py-2">
              <div className="min-h-9 flex-1 rounded-full bg-white px-4 py-2 text-[14px] text-muted-soft shadow-sm">
                {t("messagePlaceholder")}
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
