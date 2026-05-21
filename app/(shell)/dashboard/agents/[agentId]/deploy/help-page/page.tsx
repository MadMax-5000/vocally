import { notFound, redirect } from "next/navigation";

import { DeployHelpPageManage } from "@/components/dashboard/agent-detail/deploy/DeployHelpPageManage";
import { getAIAgentById } from "@/lib/actions/agents";

export default async function DeployHelpPagePage({
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

  return <DeployHelpPageManage agent={result.data} />;
}
