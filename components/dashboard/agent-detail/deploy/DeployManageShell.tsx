"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowLeftIcon } from "@/lib/icons/app-icons"

import Link from "next/link";

type DeployManageShellProps = {
  agentId: string;
  title: string;
  description?: string;
  variant?: "default" | "wide";
  children: React.ReactNode;
};

export function DeployManageShell({
  agentId,
  title,
  description,
  variant = "default",
  children,
}: DeployManageShellProps) {
  const isWide = variant === "wide";

  return (
    <div
      className={`mx-auto flex flex-col gap-4 py-4 ${
        isWide
          ? "max-w-7xl h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] min-h-0 overflow-hidden"
          : "max-w-4xl"
      }`}
    >
      <div className="shrink-0">
        <Link
          href={`/dashboard/agents/${agentId}?tab=deploy`}
          className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-muted transition-colors hover:text-ink"
        >
          <AppIcon icon={ArrowLeftIcon} className="size-3.5" />
          Back to Deploy
        </Link>
        <h2 className="font-display text-display-sm font-normal tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-body-sm text-muted">{description}</p>
        ) : null}
      </div>
      <div className={isWide ? "min-h-0 flex-1 overflow-hidden" : undefined}>
        {children}
      </div>
    </div>
  );
}
