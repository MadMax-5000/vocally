import { notFound, redirect } from "next/navigation";

import { DeployChatWidgetManage } from "@/components/dashboard/agent-detail/deploy/DeployChatWidgetManage";
import { getAIAgentById } from "@/lib/actions/agents";

export default async function DeployChatWidgetPage({
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

  return <DeployChatWidgetManage agent={result.data} />;
}
