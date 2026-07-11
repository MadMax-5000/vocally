import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const t = await getTranslations("dashboard.common");
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="mt-5 text-display-sm font-display tracking-tight text-ink text-balance">
            {t("unableToLoadAnalytics")}
          </h2>
          <p className="mt-3 max-w-[380px] text-body-sm leading-relaxed text-muted text-balance">
            {t("unableToLoadDashboardStats")}
          </p>
          <Link href="/dashboard/agents" className="mt-8">
            <Button variant="primary">
              {t("goToAgents")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardClient stats={result.data} />;
}
