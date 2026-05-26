import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { DeployEmailManage } from "@/components/dashboard/agent-detail/deploy/DeployEmailManage";
import { getAIAgentById } from "@/lib/actions/agents";
import { getAgentGmailSettings } from "@/lib/actions/gmail-connection";

export default async function DeployEmailPage({
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

  const gmailResult = await getAgentGmailSettings(params.agentId);
  if (!gmailResult.success) {
    throw new Error(gmailResult.error);
  }

  return (
    <Suspense fallback={<div className="px-4 py-8 text-body-sm text-muted">Loading…</div>}>
      <DeployEmailManage agent={result.data} initialGmailSettings={gmailResult.data} />
    </Suspense>
  );
}
