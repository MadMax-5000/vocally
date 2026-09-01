import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import { getAIAgentById } from "@/lib/actions/agents";
import { redirect } from "@/i18n/routing";

export async function loadDeployAgent(agentId: string): Promise<AgentDetailWithRelations> {
  const result = await getAIAgentById(agentId);
  if (result.success) return result.data;

  if (result.code === "UNAUTHORIZED") {
    const locale = await getLocale();
    redirect({ href: "/onboarding", locale });
  }

  notFound();
}
