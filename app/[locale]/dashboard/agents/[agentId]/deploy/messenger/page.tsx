import { DeployMessengerManage } from "@/components/dashboard/agent-detail/deploy/DeployMessengerManage";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployMessengerPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  return (
    <DeployMessengerManage
      agent={agent}
      initialSettings={{ connection: null }}
    />
  );
}
