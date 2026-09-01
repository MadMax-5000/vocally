import { DeployWordPressManage } from "@/components/dashboard/agent-detail/deploy/DeployWordPressManage";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployWordPressPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  return <DeployWordPressManage agent={agent} />;
}
