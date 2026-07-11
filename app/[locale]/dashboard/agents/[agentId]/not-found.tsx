import { Link } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function AgentNotFound() {
  const t = await getTranslations("dashboard.agents");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-display-sm font-display tracking-tight text-ink">
        {t("agentNotFound")}
      </h1>
      <p className="text-body-sm text-muted">
        {t("agentNotFoundDescription")}
      </p>
      <Button variant="primary" size="sm" asChild>
        <Link href="/dashboard/agents">{t("backToAgents")}</Link>
      </Button>
    </div>
  );
}
