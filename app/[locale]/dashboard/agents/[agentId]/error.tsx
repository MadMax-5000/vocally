"use client";

import { Link } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function AgentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.agents");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-display-sm font-display tracking-tight text-ink">
        {t("agentNotFound")}
      </h1>
      <p className="text-body-sm text-muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : t("agentNotFoundDescription")}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          {t("retry")}
        </Button>
        <Button variant="primary" size="sm" asChild>
          <Link href="/dashboard/agents">{t("backToAgents")}</Link>
        </Button>
      </div>
    </div>
  );
}
