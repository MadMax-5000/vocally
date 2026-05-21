import { notFound, redirect } from "next/navigation";

import { AgentDetailShell } from "@/components/dashboard/agent-detail/AgentDetailShell";
import { getAIAgentById } from "@/lib/actions/agents";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const result = await getAIAgentById(params.agentId);

  if (!result.success) {
    if (result.code === "UNAUTHORIZED") {
      redirect("/onboarding");
    }
    if (result.code === "NOT_FOUND") {
      notFound();
    }
    throw new Error(result.error);
  }

  const agent = result.data;

  return (
    <div className="flex flex-col gap-0 py-0">
      <AgentDetailShell agent={agent} />
    </div>
  );
}
