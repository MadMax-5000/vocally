import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AgentNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-display-sm font-display tracking-tight text-ink">
        Agent not found
      </h1>
      <p className="text-body-sm text-muted">
        This agent does not exist or you do not have access to it.
      </p>
      <Button variant="primary" size="sm" asChild>
        <Link href="/dashboard/agents">Back to agents</Link>
      </Button>
    </div>
  );
}
