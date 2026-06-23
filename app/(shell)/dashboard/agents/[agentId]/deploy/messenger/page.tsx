import { notFound, redirect } from "next/navigation";

import { DeployMessengerManage } from "@/components/dashboard/agent-detail/deploy/DeployMessengerManage";
import { getAIAgentById } from "@/lib/actions/agents";
import { getAgentMessengerSettings } from "@/lib/actions/messenger-connection";

export default async function DeployMessengerPage({
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

  const settings = await getAgentMessengerSettings(params.agentId);
  if (!settings.success) {
    throw new Error(settings.error);
  }

  return <DeployMessengerManage agent={result.data} initialSettings={settings.data} />;
}

