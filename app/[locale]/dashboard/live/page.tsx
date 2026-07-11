import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { getLiveSessions } from "@/lib/actions/sessions";
import { LiveMonitorClient } from "@/components/dashboard/live/LiveMonitorClient";

export default async function LiveMonitorPage() {
  const t = await getTranslations("dashboard.common");
  const session = await auth();
  if (!session.orgId) {
    return (
      <p className="text-body-sm text-muted">
        {t("selectOrganizationLive")}
      </p>
    );
  }

  const result = await getLiveSessions();
  const sessions = result.success ? result.data : [];

  return <LiveMonitorClient initialSessions={sessions} />;
}
