"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type PreviewViewport = "desktop" | "mobile";

type InstagramDmPreviewPanelProps = {
  viewport: PreviewViewport;
  onViewportChange: (v: PreviewViewport) => void;
  accountName: string;
};

function Bubble({
  side,
  children,
}: {
  side: "in" | "out";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex",
        side === "in" ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-body-sm leading-relaxed",
          side === "in"
            ? "bg-surface-card text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] ring-1 ring-inset ring-hairline"
            : "bg-ink text-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function InstagramDmPreviewPanel({
  viewport,
  onViewportChange,
  accountName,
}: InstagramDmPreviewPanelProps) {
  const t = useTranslations("dashboard.deploy.channels.instagram");
  const tCommon = useTranslations("dashboard.deploy.channels.common");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">{tCommon("preview")}</h3>
        <div className="inline-flex rounded-lg border border-hairline bg-canvas-soft p-0.5">
          {(["desktop", "mobile"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewportChange(v)}
              className={cn(
                "rounded-md px-2.5 py-1 text-caption capitalize transition-colors",
                viewport === v
                  ? "bg-surface-card font-medium text-ink shadow-sm"
                  : "text-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80 p-6">
          <div
            className={cn(
              "overflow-hidden rounded-[28px] border border-hairline bg-surface-card shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]",
              viewport === "mobile" ? "h-[640px] w-[320px]" : "h-[720px] w-[420px]",
            )}
          >
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <div className="size-8 rounded-full bg-surface-strong" />
              <div className="min-w-0">
                <p className="truncate text-body-sm font-medium text-ink">
                  {accountName}
                </p>
                <p className="text-caption text-muted">{t("direct")}</p>
              </div>
            </div>

            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
                <p className="mx-auto w-fit rounded-full bg-surface-strong px-3 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {t("today")}
                </p>
                <Bubble side="in">
                  {t("sampleIncomingOne")}
                </Bubble>
                <Bubble side="out">
                  {t("sampleOutgoingOne")}
                </Bubble>
                <Bubble side="in">
                  {t("sampleIncomingTwo")}
                </Bubble>
                <Bubble side="out">
                  {t("sampleOutgoingTwo")}
                </Bubble>
              </div>

              <div className="border-t border-hairline px-3 py-3">
                <div className="flex items-center gap-2 rounded-full border border-hairline bg-canvas-soft/70 px-3 py-2">
                  <div className="size-2.5 rounded-full bg-surface-strong" />
                  <p className="min-w-0 flex-1 truncate text-caption text-muted">
                    {t("message")}
                  </p>
                  <div className="size-8 rounded-full bg-surface-strong" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

