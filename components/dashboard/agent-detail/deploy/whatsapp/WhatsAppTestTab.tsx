"use client";

import { useTranslations } from "next-intl";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon, CircleIcon } from "@/lib/icons/app-icons";

import type { AgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";
import { cn } from "@/lib/utils";

type WhatsAppTestTabProps = {
  agentName: string;
  settings: AgentWhatsAppSettings;
};

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm">
      {done ? (
        <AppIcon icon={CheckIcon} size={16} className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <AppIcon icon={CircleIcon} size={16} className="mt-0.5 size-4 shrink-0 text-muted-soft" aria-hidden />
      )}
      <span className={cn(done ? "text-ink" : "text-muted")}>{label}</span>
    </li>
  );
}

export function WhatsAppTestTab({ agentName, settings }: WhatsAppTestTabProps) {
  const t = useTranslations("dashboard.deploy.messaging.whatsapp.test");
  const { readiness, connection } = settings;
  const ready =
    readiness.channelEnabled &&
    readiness.agentActive &&
    readiness.agentPublic &&
    readiness.connectionOnline &&
    readiness.platformConfigured;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("readiness.title")}</h2>
        <ul className="mt-4 space-y-2.5">
          <ChecklistItem done={readiness.platformConfigured} label={t("readiness.platformConfigured")} />
          <ChecklistItem done={readiness.channelEnabled} label={t("readiness.channelEnabled")} />
          <ChecklistItem done={readiness.agentPublic} label={t("readiness.agentPublic")} />
          <ChecklistItem done={readiness.agentActive} label={t("readiness.agentActive")} />
          <ChecklistItem
            done={readiness.connectionOnline}
            label={t("readiness.connectionOnline")}
          />
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
            number: (chunks) => (
              <span className="font-mono font-medium text-ink">{chunks}</span>
            ),
            agent: (chunks) => <span className="text-ink">{chunks}</span>,
            agentName,
            phoneNumber: connection?.twilioNumber ?? t("messaging.connectedNumber"),
          })}
        </p>
      </section>
    </div>
  );
}
