import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-32">
      <div className="flex flex-col items-center text-center">

        <h2 className="mt-5 text-display-sm font-display tracking-tight text-ink text-balance">
          Create your first AI agent
        </h2>

        <p className="mt-3 max-w-[380px] text-body-sm leading-relaxed text-muted text-balance">
          Build an AI employee trained for your workflows, support, sales, or operations. Set it up in minutes and start taking calls instantly.
        </p>

        <Link href="/dashboard/agents/new" className="mt-8">
          <Button variant="primary">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>
    </div>
  );
}
