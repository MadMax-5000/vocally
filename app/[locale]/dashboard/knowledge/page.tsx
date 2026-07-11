import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";

import { KnowledgeBaseClient } from "@/components/dashboard/knowledge/KnowledgeBaseClient";
import { getKnowledgeDashboardData } from "@/lib/actions/knowledge";

export default async function KnowledgePage() {
  const t = await getTranslations("dashboard.common");
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    return (
      <p className="text-body-sm text-muted">
        {t("selectOrganizationKnowledge")}
      </p>
    );
  }

  const result = await getKnowledgeDashboardData();

  if (!result.success) {
    return (
      <p className="text-body-sm text-muted">
        {result.error ?? t("couldNotLoadKnowledge")}
      </p>
    );
  }

  return <KnowledgeBaseClient initial={result.data} />;
}
