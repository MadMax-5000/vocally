"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowUpIcon } from "@/lib/icons/app-icons"
import { useTranslations } from "next-intl";

/** Chat widget card hero — tall panel anchored to the bottom, clipped at the card edge. */
export function ChatWidgetHeroPreview() {
  const t = useTranslations("dashboard.deploy.hero");
  return (
    <div
      className="pointer-events-none absolute inset-x-5 bottom-0 top-3 flex justify-center"
      aria-hidden
    >
      <div className="flex h-full w-full max-w-[320px] flex-col overflow-hidden rounded-t-2xl border border-white/90 bg-surface-card shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
        <div className="shrink-0 border-b border-hairline-soft px-5 py-3.5">
          <span className="text-[13px] font-medium tracking-[-0.01em] text-ink">
            {t("agentName")}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-surface-card px-5 pb-8 pt-5">
          <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-surface-strong px-4 py-3 text-[12px] leading-relaxed text-ink">
            {t("greeting")}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Help page card hero — wide browser window anchored to the bottom. */
export function HelpPageHeroPreview() {
  const t = useTranslations("dashboard.deploy.hero");
  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-0 top-[15%] flex justify-center"
      aria-hidden
    >
      <div className="flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-t-2xl border border-white/90 bg-surface-card shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-hairline-soft bg-canvas-soft/50 px-5">
          <span className="size-3 shrink-0 rounded-full bg-[#ff5f57]" />
          <span className="size-3 shrink-0 rounded-full bg-[#febc2e]" />
          <span className="size-3 shrink-0 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-surface-card px-8 py-8 text-center">
          <p className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
            {t("helpHeading")}
          </p>
          <div className="mt-6 flex h-11 w-full items-center gap-3 rounded-2xl border border-hairline bg-surface-card px-5">
            <span className="min-w-0 flex-1 truncate text-left text-[13px] text-muted-soft">
              {t("askQuestion")}
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center text-muted">
              <AppIcon icon={ArrowUpIcon} className="size-[18px]" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
