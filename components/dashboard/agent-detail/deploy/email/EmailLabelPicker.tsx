"use client";
import { useTranslations } from "next-intl";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon } from "@/lib/icons/app-icons"

import { Checkbox } from "@/components/ui/checkbox";
import type { GmailLabelOption } from "@/lib/actions/gmail-connection";
import { cn } from "@/lib/utils";

type EmailLabelPickerProps = {
  options: GmailLabelOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
};

export function EmailLabelPicker({
  options,
  selectedIds,
  onChange,
  loading,
  error,
}: EmailLabelPickerProps) {
  const t = useTranslations("dashboard.deploy.generic");
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-body-sm text-muted">
        <AppIcon icon={LoaderIcon} className="size-4 animate-spin" />
        {t("loadingGmailLabels")}
      </div>
    );
  }

  if (error) {
    return <p className="text-caption text-red-600">{error}</p>;
  }

  if (options.length === 0) {
    return <p className="text-caption text-muted-soft">{t("noLabels")}</p>;
  }

  function toggle(id: string, checked: boolean) {
    if (checked) {
      if (!selectedIds.includes(id)) {
        onChange([...selectedIds, id]);
      }
      return;
    }
    const next = selectedIds.filter((x) => x !== id);
    onChange(next.length > 0 ? next : ["INBOX"]);
  }

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-hairline bg-surface-card p-2">
      {options.map((label) => {
        const checked = selectedIds.includes(label.id);
        return (
          <label
            key={label.id}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-canvas-soft/80",
              checked && "bg-canvas-soft/50",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => toggle(label.id, v === true)}
              aria-label={label.name}
            />
            <span className="min-w-0 flex-1 text-body-sm text-ink">{label.name}</span>
            {label.type === "system" ? (
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-soft">
                {t("system")}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
