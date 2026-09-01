import { DeployApiManage } from "@/components/dashboard/agent-detail/deploy/DeployApiManage";
import { ensureAgentApiToken } from "@/lib/actions/agents";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployApiPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  const tokenResult = await ensureAgentApiToken(params.agentId);

  return (
    <DeployApiManage
      agent={agent}
      apiToken={tokenResult.success ? tokenResult.data.apiToken : ""}
    />
  );
}
