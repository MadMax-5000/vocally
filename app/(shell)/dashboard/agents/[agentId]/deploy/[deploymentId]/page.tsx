import { notFound, redirect } from "next/navigation";

import { DeployStubManage } from "@/components/dashboard/agent-detail/deploy/DeployStubManage";
import {
  getDeployCatalogEntry,
  isDeploymentComingSoon,
} from "@/lib/constants/deploy-catalog";
import { getAIAgentById } from "@/lib/actions/agents";

export default async function DeployStubPage({
  params,
}: {
  params: { agentId: string; deploymentId: string };
}) {
  const { agentId, deploymentId } = params;

  const entry = getDeployCatalogEntry(deploymentId);
  if (!entry) notFound();

  if (!isDeploymentComingSoon(deploymentId)) {
    notFound();
  }

  const result = await getAIAgentById(agentId);
  if (!result.success) {
    if (result.code === "UNAUTHORIZED") redirect("/onboarding");
    if (result.code === "NOT_FOUND") notFound();
    throw new Error(result.error);
  }

  if (!("iconSrc" in entry)) notFound();

  return <DeployStubManage agentId={agentId} entry={entry} />;
}
