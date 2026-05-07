import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { getUserAIAgents } from "@/lib/actions/agents";
import { AgentEmptyState } from "@/components/dashboard/AgentEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCreatedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AgentsPage() {
  const session = await auth();
  const orgId = session.orgId;
  if (!orgId) return <AgentEmptyState />;

  const result = await getUserAIAgents();

  if (!result.success || result.data.length === 0) {
    return <AgentEmptyState />;
  }

  const user = await currentUser();
  const createdBy =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "—";

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink">
          Agents
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Browse templates
          </Button>
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

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface-card">
        <div className="grid grid-cols-[1fr_320px_220px_44px] items-center border-b border-hairline px-4 py-3">
          <div className="text-[12px] font-medium leading-none text-muted">
            Name
          </div>
          <div className="text-[12px] font-medium leading-none text-muted">
            Created by
          </div>
          <div className="flex items-center justify-end gap-1 text-[12px] font-medium leading-none text-muted">
            <span>Created at</span>
            <span aria-hidden className="text-muted/70">
              ↓
            </span>
          </div>
          <div />
        </div>

        <div className="divide-y divide-hairline">
          {result.data.map(
            (agent: {
              id: string;
              name: string | null;
              title: string | null;
              field: string | null;
              createdAt: Date;
            }) => (
              <div
                key={agent.id}
                className="grid grid-cols-[1fr_320px_220px_44px] items-center px-4 py-4"
              >
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="text-body-md text-ink transition-opacity hover:opacity-70"
                >
                  {agent.name}
                </Link>

                <div className="truncate text-body-sm text-body">
                  {createdBy}
                </div>

                <div className="text-right text-body-sm text-body">
                  {formatCreatedAt(new Date(agent.createdAt))}
                </div>

                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Agent actions"
                        className="text-muted hover:text-ink"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/agents/${agent.id}`}>
                          Open
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
