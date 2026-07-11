import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { AgentDetailShell } from "@/components/dashboard/agent-detail/AgentDetailShell";
import { getAIAgentById } from "@/lib/actions/agents";
import { getTranslations } from "next-intl/server";

export default async function AgentDetailPage({
  params,
}: {
  params: { agentId: string };
}) {
  const t = await getTranslations("dashboard.agents");
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
      <Suspense
        fallback={
          <div className="flex min-h-[320px] items-center justify-center text-body-sm text-muted">
            {t("loadingAgent")}
          </div>
        }
      >
        <AgentDetailShell agent={agent} />
      </Suspense>
    </div>
  );
}
