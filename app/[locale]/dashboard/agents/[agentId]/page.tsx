import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AgentDetailShell } from "@/components/dashboard/agent-detail/AgentDetailShell";
import { getViewerPlan } from "@/lib/billing/get-viewer-plan";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const t = await getTranslations("dashboard.agents");
  const [agent, plan] = await Promise.all([
    loadDeployAgent(params.agentId),
    getViewerPlan(),
  ]);

  return (
    <div className="flex flex-col gap-0 py-0">
      <Suspense
        fallback={
          <div className="flex min-h-[320px] items-center justify-center text-body-sm text-muted">
            {t("loadingAgent")}
          </div>
        }
      >
        <AgentDetailShell agent={agent} plan={plan ?? "FREE"} />
      </Suspense>
    </div>
  );
}
