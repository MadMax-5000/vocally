import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-strong">
          <Sparkles className="h-7 w-7 text-muted" />
        </div>

        <h2 className="mt-6 text-display-sm font-display font-bold tracking-tight text-ink">
          Create your first AI agent
        </h2>

        <p className="mt-3 max-w-md text-body-md leading-relaxed text-body">
          Build an AI employee trained for your workflows, support, sales, or operations.
          Set it up in minutes and start taking calls instantly.
        </p>

        <Link href="/dashboard/agents/new" className="mt-8">
          <Button variant="primary" size="lg">
            Create Agent
          </Button>
        </Link>
      </div>
    </div>
  );
}
