import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  id: string;
  name: string;
  title: string;
  field: string;
  createdAt: Date;
  className?: string;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AgentCard({ id, name, title, field, createdAt, className }: AgentCardProps) {
  return (
    <Link
      href={`/dashboard/agents/${id}`}
      className={cn(
        "group flex flex-col rounded-xl border border-hairline bg-surface-card p-6 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-hairline-strong",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-body-strong">
          <span className="text-title-md font-display font-normal text-ink">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-all group-hover:opacity-100" />
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-title-md font-medium text-ink">{name}</h3>
        <p className="text-body-sm text-body">{title}</p>
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center rounded-pill bg-surface-strong px-2.5 py-0.5 text-caption-uppercase text-muted">
          {field}
        </span>
      </div>

      <div className="mt-auto pt-4">
        <p className="text-caption text-muted-soft">
          Created {formatRelativeDate(createdAt)}
        </p>
      </div>
    </Link>
  );
}
