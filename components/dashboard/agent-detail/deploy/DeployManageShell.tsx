"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type DeployManageShellProps = {
  agentId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function DeployManageShell({
  agentId,
  title,
  description,
  children,
}: DeployManageShellProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">
      <div>
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back to Deploy
        </Link>
        <h2 className="font-display text-display-sm font-normal tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-body-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
