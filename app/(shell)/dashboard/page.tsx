import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/actions/sessions";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    redirect("/dashboard/agents");
  }

  return <DashboardClient stats={result.data} />;
}
