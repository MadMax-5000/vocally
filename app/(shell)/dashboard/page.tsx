import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/actions/sessions";
import { getUserAIAgents } from "@/lib/actions/agents";

export default async function DashboardPage() {
  const agentsResult = await getUserAIAgents();
  if (agentsResult.success && agentsResult.data.length === 0) {
    redirect("/dashboard/agents/new");
  }

  const result = await getDashboardStats();

  if (!result.success) {
    redirect("/dashboard/agents");
  }

  return <DashboardClient stats={result.data} />;
}
