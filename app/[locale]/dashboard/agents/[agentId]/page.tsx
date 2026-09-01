import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AgentDetailShell } from "@/components/dashboard/agent-detail/AgentDetailShell";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const t = await getTranslations("dashboard.agents");
  const agent = await loadDeployAgent(params.agentId);

  return (
    <div className="flex flex-col gap-0 py-0">
      <Suspense
        fallback={
          <div className="flex min-h-[320px] items-center justify-center text-body-sm text-muted">
            {t("loadingAgent")}
          </div>
        }
      >
        <AgentDetailShell agent={agent} />
      </Suspense>
    </div>
  );
}
