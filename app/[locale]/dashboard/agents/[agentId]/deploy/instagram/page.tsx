import { DeployInstagramManage } from "@/components/dashboard/agent-detail/deploy/DeployInstagramManage";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployInstagramPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  return <DeployInstagramManage agent={agent} />;
}
