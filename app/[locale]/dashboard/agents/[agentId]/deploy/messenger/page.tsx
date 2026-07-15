import { notFound, redirect } from "next/navigation";

import { DeployMessengerManage } from "@/components/dashboard/agent-detail/deploy/DeployMessengerManage";
import { getAIAgentById } from "@/lib/actions/agents";

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

  return (
    <DeployMessengerManage
      agent={result.data}
      initialSettings={{ connection: null }}
    />
  );
}
