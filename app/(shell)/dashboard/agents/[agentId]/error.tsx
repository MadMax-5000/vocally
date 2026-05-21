"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AgentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-display-sm font-display tracking-tight text-ink">
        Could not load agent
      </h1>
      <p className="text-body-sm text-muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong while loading this agent. Try again or return to the list."}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
        <Button variant="primary" size="sm" asChild>
          <Link href="/dashboard/agents">Back to agents</Link>
        </Button>
      </div>
    </div>
  );
}
