import { notFound, redirect } from "next/navigation";
import { DeployPhoneManage } from "@/components/dashboard/agent-detail/deploy/DeployPhoneManage";
import { getAIAgentById } from "@/lib/actions/agents";
import { getPhoneConnectionSettings } from "@/lib/actions/phone-connection";

export default async function DeployPhonePage({
  params,
}: {
  params: { agentId: string };
}) {
  const result = await getAIAgentById(params.agentId);

  if (!result.success) {
    if (result.code === "UNAUTHORIZED") redirect("/onboarding");
    if (result.code === "NOT_FOUND") notFound();
    throw new Error(result.error || "Failed to load agent");
  }

  const settings = await getPhoneConnectionSettings(params.agentId);
  if (!settings.success) {
    throw new Error(settings.error || "Failed to load phone settings");
  }

  return (
    <DeployPhoneManage agent={result.data} initialSettings={settings.data} />
  );
}
