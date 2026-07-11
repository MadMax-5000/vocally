import { notFound, redirect } from "next/navigation";

import { DeployApiManage } from "@/components/dashboard/agent-detail/deploy/DeployApiManage";
import { ensureAgentApiToken, getAIAgentById } from "@/lib/actions/agents";

export default async function DeployApiPage({
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

  const tokenResult = await ensureAgentApiToken(params.agentId);
  if (!tokenResult.success) {
    throw new Error(tokenResult.error);
  }

  return (
    <DeployApiManage agent={result.data} apiToken={tokenResult.data.apiToken} />
  );
}
