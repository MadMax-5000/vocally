import { notFound } from "next/navigation";

import { AgentDetailShell } from "@/components/dashboard/agent-detail/AgentDetailShell";
import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { getAIAgentById } from "@/lib/actions/agents";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const result = await getAIAgentById(params.agentId);

  if (!result.success || !result.data) {
    notFound();
  }

  const agent = result.data as AgentDetailWithRelations;

  return (
    <div className="flex flex-col gap-0 py-0">
      <AgentDetailShell agent={agent} />
    </div>
  );
}
