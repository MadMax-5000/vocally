"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { CheckIcon, CircleIcon } from "@/lib/icons/app-icons"
import { useTranslations } from "next-intl";

import type { AgentSmsSettings } from "@/lib/actions/sms-connection";
import { isSmsReady } from "@/lib/deploy/sms-config";
import { cn } from "@/lib/utils";

type SmsTestTabProps = {
  agentName: string;
  settings: AgentSmsSettings;
};

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm">
      {done ? (
        <AppIcon icon={CheckIcon} className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <AppIcon icon={CircleIcon} className="mt-0.5 size-4 shrink-0 text-muted-soft" aria-hidden />
      )}
      <span className={cn(done ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function SmsTestTab({ agentName, settings }: SmsTestTabProps) {
  const t = useTranslations("dashboard.deploy.messaging.sms.test");
  const { readiness } = settings;
  const ready = isSmsReady(readiness);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("readiness.title")}</h2>
        <ul className="mt-4 space-y-2.5">
          <ChecklistItem done={readiness.platformConfigured} label={t("readiness.platformConfigured")} />
          <ChecklistItem done={readiness.channelEnabled} label={t("readiness.channelEnabled")} />
          <ChecklistItem done={readiness.agentPublic} label={t("readiness.agentPublic")} />
          <ChecklistItem done={readiness.agentActive} label={t("readiness.agentActive")} />
          <ChecklistItem done={readiness.mappingActive} label={t("readiness.mappingActive")} />
        </ul>

        {ready ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
            {t("readiness.ready")}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-caption text-amber-800">
            {t("readiness.incomplete")}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("messaging.title")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t.rich("messaging.instructions", {
            number: (chunks) => <span className="font-mono font-medium text-ink">{chunks}</span>,
            agent: (chunks) => <span className="text-ink">{chunks}</span>,
            agentName,
            phoneNumber: settings.connection?.twilioNumber ?? t("messaging.linkedPhoneNumber"),
          })}
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption text-muted">
            {t("messaging.ratesNotice")}
          </p>
        </div>
      </section>
    </div>
  );
}
