import { DeployWhatsAppManage } from "@/components/dashboard/agent-detail/deploy/DeployWhatsAppManage";
import {
  emptyAgentWhatsAppSettings,
  getAgentWhatsAppSettings,
} from "@/lib/actions/whatsapp-connection";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployWhatsAppPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  const settings = await getAgentWhatsAppSettings(params.agentId);

  return (
    <DeployWhatsAppManage
      agent={agent}
      initialSettings={settings.success ? settings.data : await emptyAgentWhatsAppSettings()}
    />
  );
}
