import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AgentTemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-2">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon-sm" className="text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-display-sm font-display tracking-tight text-ink">
          Templates
        </h1>
      </div>

      <div className="flex flex-col items-center rounded-xl border border-hairline bg-surface-card px-5 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-strong">
          <LayoutTemplate className="h-6 w-6 text-muted" />
        </div>
        <p className="mt-5 text-title-md font-medium text-ink">Coming soon</p>
        <p className="mt-2 max-w-md text-body-md leading-relaxed text-body">
          Browse curated agent templates tuned for support, sales, and voice workflows. This
          library is on the way.
        </p>
        <Link href="/dashboard/agents/new" className="mt-6">
          <Button variant="primary">Create from scratch</Button>
        </Link>
      </div>
    </div>
  );
}
