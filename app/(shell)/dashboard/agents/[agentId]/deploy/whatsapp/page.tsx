import { notFound, redirect } from "next/navigation";

import { DeployWhatsAppManage } from "@/components/dashboard/agent-detail/deploy/DeployWhatsAppManage";
import { getAIAgentById } from "@/lib/actions/agents";
import { getAgentWhatsAppSettings } from "@/lib/actions/whatsapp-connection";

export default async function DeployWhatsAppPage({
  params,
}: {
  params: { agentId: string };
}) {
  const result = await getAIAgentById(params.agentId);

  if (!result.success) {
    if (result.code === "UNAUTHORIZED") redirect("/onboarding");
    if (result.code === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  const settings = await getAgentWhatsAppSettings(params.agentId);
  if (!settings.success) {
    throw new Error(settings.error);
  }

  return (
    <DeployWhatsAppManage agent={result.data} initialSettings={settings.data} />
  );
}
