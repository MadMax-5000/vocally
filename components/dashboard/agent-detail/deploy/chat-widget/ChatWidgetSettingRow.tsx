"use client";
import { useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/app-icon"
import { InfoIcon } from "@/lib/icons/app-icons"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Shared styles for configuration inputs (stacked fields). */
export const chatWidgetFieldInputClass =
  "h-10 w-full rounded-lg border-hairline bg-surface-card text-body-sm shadow-none focus-visible:border-muted-soft focus-visible:ring-0";

export const chatWidgetFieldTextareaClass =
  "min-h-[88px] w-full resize-y rounded-lg border-hairline bg-surface-card text-body-sm shadow-none focus-visible:border-muted-soft focus-visible:ring-0";

type ChatWidgetSettingRowProps = {
  label: string;
  description?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
  /** Stacked label + field (default) or horizontal row for toggles. */
  variant?: "field" | "row";
};

export function ChatWidgetSettingRow({
  label,
  description,
  tooltip,
  children,
  className,
  noBorder,
  variant = "field",
}: ChatWidgetSettingRowProps) {
  const t = useTranslations("dashboard.deploy.generic");
  const labelEl = (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          variant === "field"
            ? "text-body-sm text-muted"
            : "text-body-sm font-medium text-ink",
        )}
      >
        {label}
      </span>
      {tooltip ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-soft hover:text-muted"
                aria-label={t("moreInformation")}
              >
                <AppIcon icon={InfoIcon} className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-body-sm">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );

  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 py-3.5",
          !noBorder && "border-b border-hairline",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          {labelEl}
          {description ? (
            <p className="mt-0.5 text-caption text-muted-soft">{description}</p>
          ) : null}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 py-4",
        !noBorder && "border-b border-hairline",
        className,
      )}
    >
      {labelEl}
      {description ? (
        <p className="-mt-0.5 text-caption text-muted-soft">{description}</p>
      ) : null}
      <div className="w-full">{children}</div>
    </div>
  );
}
