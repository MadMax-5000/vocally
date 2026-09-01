import { DeploySmsManage } from "@/components/dashboard/agent-detail/deploy/DeploySmsManage";
import { emptyAgentSmsSettings, getAgentSmsSettings } from "@/lib/actions/sms-connection";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeploySmsPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  const settings = await getAgentSmsSettings(params.agentId);

  return (
    <DeploySmsManage
      agent={agent}
      initialSettings={settings.success ? settings.data : await emptyAgentSmsSettings()}
    />
  );
}
