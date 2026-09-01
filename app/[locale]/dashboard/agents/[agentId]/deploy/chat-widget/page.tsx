import { DeployChatWidgetManage } from "@/components/dashboard/agent-detail/deploy/DeployChatWidgetManage";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployChatWidgetPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  return <DeployChatWidgetManage agent={agent} />;
}
