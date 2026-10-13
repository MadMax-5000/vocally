"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckCircle, InfoIcon } from "@/lib/icons/app-icons";
import { useTranslations } from "next-intl";

import type {
  PhoneDeployDiagnostics,
  PhoneDiagnosticStatus,
} from "@/lib/phone/diagnostics";

type PhoneDiagnosticsCardProps = {
  diagnostics: PhoneDeployDiagnostics;
};

const STATUS_ROW: Record<
  PhoneDiagnosticStatus,
  { text: string; chip: string; dot: string; labelKey: string }
> = {
  ok: {
    text: "text-emerald-700",
    chip: "bg-emerald-50",
    dot: "bg-emerald-500",
    labelKey: "ok",
  },
  warn: {
    text: "text-amber-700",
    chip: "bg-amber-50",
    dot: "bg-amber-500",
    labelKey: "warn",
  },
  blocked: {
    text: "text-red-700",
    chip: "bg-red-50",
    dot: "bg-red-500",
    labelKey: "blocked",
  },
};

export function PhoneDiagnosticsCard({ diagnostics }: PhoneDiagnosticsCardProps) {
  const t = useTranslations("dashboard.deploy.channels.phone.diagnostics");

  const anyBlocked = diagnostics.items.some((i) => i.status === "blocked");
  const headerIcon = anyBlocked ? InfoIcon : CheckCircle;
  const headerDot = anyBlocked ? "bg-amber-500" : "bg-emerald-500";
  const headerText = anyBlocked ? "text-amber-700" : "text-emerald-700";

  return (
    <section className="rounded-xl border border-hairline bg-surface-card p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            anyBlocked ? "bg-amber-50" : "bg-emerald-50"
          }`}
        >
          <AppIcon icon={headerIcon} className={`size-4 ${headerText}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-title-sm font-medium text-ink">
              {t("readinessTitle")}
            </h2>
            <span className="flex shrink-0 items-center gap-1.5 text-caption font-medium">
              <span className={`inline-block size-1.5 rounded-full ${headerDot}`} />
              {t(diagnostics.ok ? "readySummary" : "notReadySummary")}
            </span>
          </div>
          <p className="mt-1 text-caption leading-relaxed text-muted">
            {t(diagnostics.summaryKey)}
          </p>
          {diagnostics.summaryDetailKey && (
            <p className="mt-1 text-caption leading-relaxed text-muted-soft">
              {t(diagnostics.summaryDetailKey)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {diagnostics.items.map((item) => {
          const row = STATUS_ROW[item.status];
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg px-3 py-2 ${row.chip}`}
            >
              <span className={`mt-1 inline-block size-1.5 shrink-0 rounded-full ${row.dot}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-body-sm font-medium ${row.text}`}>
                  {t(item.titleKey)}
                </p>
                {item.detailKey && (
                  <p className="mt-0.5 text-caption leading-relaxed text-muted">
                    {t(item.detailKey, item.params)}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-caption font-medium capitalize ${row.text}`}
              >
                {t(row.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}