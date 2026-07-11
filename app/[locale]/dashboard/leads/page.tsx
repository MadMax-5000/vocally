import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { getSidebarAgentsList } from "@/lib/actions/agents";
import { listOrgLeads } from "@/lib/actions/leads";
import { LeadsClient } from "@/components/dashboard/leads/LeadsClient";

type LeadsPageProps = {
  searchParams: Promise<{ agentId?: string; captureType?: string }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const t = await getTranslations("dashboard.common");
  const session = await auth();
  if (!session.orgId) {
    return (
      <p className="text-body-sm text-muted">
        {t("selectOrganizationLeads")}
      </p>
    );
  }

  const params = await searchParams;
  const agentId = params.agentId;
  const captureType =
    params.captureType === "collect_leads" || params.captureType === "custom_form"
      ? params.captureType
      : undefined;

  const [leadsResult, agentsResult] = await Promise.all([
    listOrgLeads({
      ...(agentId ? { agentId } : {}),
      ...(captureType ? { captureType } : {}),
      limit: 50,
    }),
    getSidebarAgentsList(),
  ]);

  const rows = leadsResult.success ? leadsResult.data.rows : [];
  const total = leadsResult.success ? leadsResult.data.total : 0;
  const agents = agentsResult.success ? agentsResult.data : [];

  return (
    <Suspense fallback={<p className="text-body-sm text-muted">{t("loading")}</p>}>
      <LeadsClient
        initialRows={rows}
        initialTotal={total}
        agents={agents}
        initialAgentId={agentId}
      />
    </Suspense>
  );
}
