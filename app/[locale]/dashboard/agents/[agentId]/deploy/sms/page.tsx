import { notFound, redirect } from "next/navigation";

import { DeploySmsManage } from "@/components/dashboard/agent-detail/deploy/DeploySmsManage";
import { getAIAgentById } from "@/lib/actions/agents";
import { getAgentSmsSettings } from "@/lib/actions/sms-connection";

export default async function DeploySmsPage({
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

  const settings = await getAgentSmsSettings(params.agentId);
  if (!settings.success) {
    throw new Error(settings.error);
  }

  return (
    <DeploySmsManage agent={result.data} initialSettings={settings.data} />
  );
}
