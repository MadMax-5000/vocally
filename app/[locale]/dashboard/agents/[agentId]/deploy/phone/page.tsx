import { DeployPhoneManage } from "@/components/dashboard/agent-detail/deploy/DeployPhoneManage";
import {
  emptyPhoneConnectionSettings,
  getPhoneConnectionSettings,
} from "@/lib/actions/phone-connection";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

export default async function DeployPhonePage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = await loadDeployAgent(params.agentId);
  const settings = await getPhoneConnectionSettings(params.agentId);

  return (
    <DeployPhoneManage
      agent={agent}
      initialSettings={settings.success ? settings.data : await emptyPhoneConnectionSettings()}
    />
  );
}
