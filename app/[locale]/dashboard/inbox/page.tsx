import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { getInboxSessions } from "@/lib/actions/sessions";
import { InboxClient } from "@/components/dashboard/inbox/InboxClient";

export default async function InboxPage() {
  const t = await getTranslations("dashboard.common");
  const session = await auth();
  if (!session.orgId) {
    return (
      <p className="text-body-sm text-muted">
        {t("selectOrganizationInbox")}
      </p>
    );
  }

  const result = await getInboxSessions();

  const sessions = result.success ? result.data : [];

  return <InboxClient sessions={sessions} />;
}
