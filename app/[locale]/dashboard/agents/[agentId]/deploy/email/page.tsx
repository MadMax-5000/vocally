import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DeployEmailManage } from "@/components/dashboard/agent-detail/deploy/DeployEmailManage";
import { emptyAgentGmailSettings, getAgentGmailSettings } from "@/lib/actions/gmail-connection";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployEmailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const t = await getTranslations("dashboard.agents");
  const agent = await loadDeployAgent(params.agentId);
  const gmailResult = await getAgentGmailSettings(params.agentId);

  return (
    <Suspense fallback={<div className="px-4 py-8 text-body-sm text-muted">{t("loadingAgent")}</div>}>
      <DeployEmailManage
        agent={agent}
        initialGmailSettings={gmailResult.success ? gmailResult.data : await emptyAgentGmailSettings()}
      />
    </Suspense>
  );
}
