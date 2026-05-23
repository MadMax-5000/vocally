import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus, Search } from "lucide-react";
import { getUserAIAgents } from "@/lib/actions/agents";
import { AgentEmptyState } from "@/components/dashboard/AgentEmptyState";
import { AgentCardGrid } from "@/components/dashboard/AgentStackedCard";
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
    <div className="mx-auto max-w-6xl flex flex-col gap-3 px-6">
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
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search agents..."
          className="h-9 rounded-lg border-hairline pl-8 pr-16 text-sm"
        />
        <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          <kbd className="rounded border border-hairline bg-surface-strong px-1.5 py-0.5 font-sans text-[11px] leading-none text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="xs" className="h-6 px-2 text-xs">
          + Creator
        </Button>
        <Button variant="outline" size="xs" className="h-6 px-2 text-xs">
          + Archived
        </Button>
      </div>

      <AgentCardGrid agents={result.data} />
    </div>
  );
}
