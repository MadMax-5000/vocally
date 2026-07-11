"use client";

import { useTranslations } from "next-intl";

type InstagramTestTabProps = { agentId: string };

export function InstagramTestTab({ agentId }: InstagramTestTabProps) {
  const t = useTranslations("dashboard.deploy.channels.instagram");
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-hairline bg-surface-card p-4">
        <h2 className="text-title-sm font-medium text-ink">{t("testMessaging")}</h2>
        <p className="mt-1 text-body-sm leading-relaxed text-muted">
          {t("testDescription")}
        </p>

        <div className="mt-4 rounded-lg border border-hairline bg-canvas-soft/60 p-3">
          <p className="text-caption text-muted">
            {t("agent", { agentId })}
          </p>
          <p className="mt-1 text-caption text-muted">
            {t("testTip")}
          </p>
        </div>
      </section>
    </div>
  );
}

