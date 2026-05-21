import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { ActionCatalogEntry } from "./action-catalog";
import { ActionCatalogIcon } from "./ActionCatalogIcon";

type ActionCatalogCardProps = {
  entry: ActionCatalogEntry;
};

function showComingSoon() {
  toast.message("Coming soon");
}

/** Feature-card pattern per DESIGN.md: surface-card, rounded-xl, hairline, soft hover shadow. */
export function ActionCatalogCard({ entry }: ActionCatalogCardProps) {
  return (
    <button
      type="button"
      onClick={showComingSoon}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-xl border border-hairline bg-surface-card p-4 text-left",
        "transition-all duration-200",
        "hover:border-hairline-strong/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      )}
    >
      <ActionCatalogIcon icon={entry.icon} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="font-display text-title-sm font-normal tracking-tight text-ink">
          {entry.title}
        </h3>
        <p className="text-pretty text-body-sm leading-relaxed text-muted">
          {entry.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entry.pills.map((pill) => (
          <span
            key={pill}
            className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 text-caption text-body ring-1 ring-inset ring-hairline"
          >
            {pill}
          </span>
        ))}
      </div>
    </button>
  );
}
