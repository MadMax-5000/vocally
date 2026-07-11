import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/app-icon"
import { PlusIcon } from "@/lib/icons/app-icons"
import { useTranslations } from "next-intl";

export function AgentEmptyState() {
  const t = useTranslations("dashboard.agents");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-32">
      <div className="flex flex-col items-center text-center">

        <h2 className="mt-5 text-display-sm font-display tracking-tight text-ink text-balance">
          {t("emptyTitle")}
        </h2>

        <p className="mt-3 max-w-[380px] text-body-sm leading-relaxed text-muted text-balance">
          {t("emptyDescription")}
        </p>

        <Link href="/dashboard/agents/new" className="mt-8">
          <Button variant="primary">
            <AppIcon icon={PlusIcon} className="mr-1.5 h-4 w-4" />
            {t("createAgent")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
