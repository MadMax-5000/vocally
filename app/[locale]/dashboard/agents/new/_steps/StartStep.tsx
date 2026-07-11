"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowUpRightIcon, LayoutPanelLeft, PlusIcon } from "@/lib/icons/app-icons"

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type StartStepProps = {
  onScratch: () => void;
  onSound: () => void;
};

export function StartStep({ onScratch, onSound }: StartStepProps) {
  const t = useTranslations("dashboard.agents.wizard");
  const agents = useTranslations("dashboard.agents");
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          {t("startTitle")}
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          {t("startDescription")}
        </p>
      </header>

      <div className="flex flex-row gap-4">
        {/* Scratch card */}
        <button
          type="button"
          onClick={() => { onSound(); onScratch(); }}
          className={cn(
            "flex flex-1 w-full flex-col gap-4 rounded-xl border border-hairline bg-surface-card p-6 text-left transition-colors",
            "hover:border-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-surface-strong text-muted">
            <AppIcon icon={PlusIcon} className="h-[18px] w-[18px]" aria-hidden />
          </span>

          <span className="flex flex-1 flex-col gap-2">
            <span className="flex items-center gap-2 text-title-sm font-semibold text-ink">
              {agents("buildFromScratch")}
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-[2px] text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                {t("recommended")}
              </span>
            </span>
            <span className="text-body-sm text-muted leading-relaxed">
              {t("startScratchDescription")}
            </span>
          </span>

          {/* Chat preview */}
          <div className="relative mt-1 aspect-[6/3] w-full overflow-hidden rounded-lg">
            <Image
              src="/images/background1.png"
              alt={t("conversationPreview")}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/20" />

            <div className="absolute inset-0 flex flex-col justify-center gap-3 px-8 py-10">
              {/* User — right-aligned, glass */}
              <div className="flex justify-end">
                <div className="max-w-[60%] rounded-[18px] rounded-tr-sm border border-white/30 bg-white/15 px-3 py-1 backdrop-blur-sm">
                  <p className="text-[12px] font-medium leading-snug text-white">
                    {t("startQuestion")}
                  </p>
                </div>
              </div>

              {/* Bot — left-aligned, white card */}
              <div className="flex justify-start">
                <div className="max-w-[95%] rounded-[18px] rounded-tl-sm bg-surface-card px-3 py-1.5 shadow-sm">
                  <p className="text-[12px] leading-snug text-ink">
                    {t("startAnswer")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Templates card */}
        <Link
          href="/dashboard/agents/templates"
          className="block flex-1"
          onClick={() => onSound()}
        >
          <span
            className={cn(
              "relative flex h-full w-full flex-col gap-4 rounded-xl border border-hairline bg-surface-card p-6 text-left transition-colors",
              "hover:border-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            )}
          >
            <AppIcon icon={ArrowUpRightIcon} className="absolute right-6 top-6 h-4 w-4 text-muted" aria-hidden />
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-surface-strong text-muted">
              <AppIcon icon={LayoutPanelLeft} className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="flex flex-1 flex-col gap-2">
              <span className="text-title-sm font-semibold text-ink">{agents("browseTemplates")}</span>
              <span className="text-body-sm text-muted leading-relaxed">
                {t("templatesDescription")}
              </span>
            </span>
          </span>
        </Link>
      </div>

      <p className="text-center text-caption text-muted-soft">
        {t("refineHint")}
      </p>
    </div>
  );
}