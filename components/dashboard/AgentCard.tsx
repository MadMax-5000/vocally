import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/app-icon"
import { ArrowUpRightIcon } from "@/lib/icons/app-icons"
import { getTranslations } from "next-intl/server";

interface AgentCardProps {
  id: string;
  name: string;
  title: string;
  field: string;
  createdAt: Date;
  className?: string;
}

function formatRelativeDate(date: Date, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return t("justNow");
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  if (diffHr < 24) return t("hoursAgo", { count: diffHr });
  if (diffDay < 7) return t("daysAgo", { count: diffDay });
  if (diffDay < 30) return t("weeksAgo", { count: Math.floor(diffDay / 7) });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export async function AgentCard({ id, name, title, field, createdAt, className }: AgentCardProps) {
  const t = await getTranslations("dashboard.agents");
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
        <AppIcon icon={ArrowUpRightIcon} className="h-4 w-4 text-muted opacity-0 transition-all group-hover:opacity-100" />
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
          {t("created", { date: formatRelativeDate(createdAt, t) })}
        </p>
      </div>
    </Link>
  );
}
