import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus, Search } from "lucide-react";
import { getUserAIAgents } from "@/lib/actions/agents";
import { AgentEmptyState } from "@/components/dashboard/AgentEmptyState";
import { AgentStackedCard } from "@/components/dashboard/AgentStackedCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AgentsPage() {
  const session = await auth();
  const orgId = session.orgId;
  if (!orgId) return <AgentEmptyState />;

  const result = await getUserAIAgents();

  if (!result.success || result.data.length === 0) {
    return <AgentEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-display-sm font-display tracking-tight text-ink">
          Agents
        </h1>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/agents/templates">
            <Button variant="outline" size="sm">
              Browse templates
            </Button>
          </Link>
          <Link href="/dashboard/agents/new">
            <Button variant="primary" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New agent
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search agents..."
          className="h-10 rounded-lg border-hairline pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="xs" className="h-7 px-3">
          + Creator
        </Button>
        <Button variant="outline" size="xs" className="h-7 px-3">
          + Archived
        </Button>
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.data.map((agent: any, index: number) => (
          <AgentStackedCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}
