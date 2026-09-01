import { notFound } from "next/navigation";

import { DeployStubManage } from "@/components/dashboard/agent-detail/deploy/DeployStubManage";
import {
  getDeployCatalogEntry,
  isDeploymentComingSoon,
} from "@/lib/constants/deploy-catalog";
import { loadDeployAgent } from "@/lib/dashboard/load-deploy-agent";

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

  await loadDeployAgent(agentId);

  if (!("iconSrc" in entry)) notFound();

  return <DeployStubManage agentId={agentId} entry={entry} />;
}
