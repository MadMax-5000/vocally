import { DeployHelpPageManage } from "@/components/dashboard/agent-detail/deploy/DeployHelpPageManage";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployHelpPagePage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  return <DeployHelpPageManage agent={agent} />;
}
