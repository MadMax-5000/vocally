import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-32">
        <div className="flex flex-col items-center text-center">
          <h2 className="mt-5 text-display-sm font-display tracking-tight text-ink text-balance">
            Unable to load analytics
          </h2>
          <p className="mt-3 max-w-[380px] text-body-sm leading-relaxed text-muted text-balance">
            We couldn&apos;t load your dashboard stats.
          </p>
          <Link href="/dashboard/agents" className="mt-8">
            <Button variant="primary">
              Go to Agents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardClient stats={result.data} />;
}
