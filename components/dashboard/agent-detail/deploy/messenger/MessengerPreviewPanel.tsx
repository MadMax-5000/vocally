"use client";

import { useMemo } from "react";

import type { AgentMessengerSettings } from "@/lib/actions/messenger-connection";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  agentName: string;
  settings: AgentMessengerSettings;
};

function nowTime(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function Bubble({
  side,
  children,
}: {
  side: "in" | "out";
  children: React.ReactNode;
}) {
  const isOut = side === "out";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-body-sm leading-relaxed",
          isOut
            ? "bg-[#0A84FF] text-white"
            : "bg-surface-card text-ink border border-hairline",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function MessengerPreviewPanel({ agentName, settings }: Props) {
  const t = useTranslations("dashboard.deploy.channels.messenger");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  const locale = useLocale();
  const pageName = settings.connection?.pageName ?? t("yourFacebookPage");
  const sampleUser = t("customer");

  const transcript = useMemo(
    () => [
      { side: "in" as const, text: t("sampleIncomingOne") },
      { side: "out" as const, text: t("sampleOutgoingOne") },
      { side: "in" as const, text: t("sampleIncomingTwo") },
      { side: "out" as const, text: t("sampleOutgoingTwo") },
    ],
    [t],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">{tCommon("preview")}</h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80 p-6">
          <div className="flex h-full min-h-0 w-full max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-hairline bg-surface-card shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]">
            <div className="shrink-0 border-b border-hairline bg-surface-card px-4 py-3">
              <p className="text-body-sm font-medium text-ink">{pageName}</p>
              <p className="text-caption text-muted">
                {t("replyingAs", { agentName })}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-canvas-soft/40 px-3 py-3">
              <p className="mb-3 text-center text-[11px] text-muted-soft">
                {t("todayAt", { customer: sampleUser, time: nowTime(locale) })}
              </p>
              <div className="space-y-2">
                {transcript.map((m, idx) => (
                  <Bubble key={idx} side={m.side}>
                    {m.text}
                  </Bubble>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-hairline bg-surface-card px-3 py-3">
              <div className="flex items-center gap-2 rounded-full border border-hairline bg-canvas-soft/60 px-3 py-2">
                <span className="text-caption text-muted">{t("message")}</span>
                <span className="ml-auto text-caption text-muted-soft">↩</span>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-soft">
                {t("previewOnly")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

