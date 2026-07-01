import { cn } from "@/lib/utils";
import type { ActionCatalogEntry } from "./action-catalog";
import { ActionCatalogIcon } from "./ActionCatalogIcon";

type ActionCatalogCardProps = {
  entry: ActionCatalogEntry;
  onClick?: () => void;
  configured?: boolean;
  comingSoon?: boolean;
};

/** Feature-card pattern per DESIGN.md: surface-card, rounded-xl, hairline, soft hover shadow. */
export function ActionCatalogCard({
  entry,
  onClick,
  configured,
  comingSoon = false,
}: ActionCatalogCardProps) {
  if (comingSoon) {
    return (
      <article
        aria-disabled
        className={cn(
          "relative flex min-h-[168px] w-full flex-col overflow-hidden rounded-xl",
          "border border-dashed border-hairline-strong bg-surface-strong/80",
        )}
      >
        <div className="pointer-events-none flex flex-1 flex-col p-3">
          <div className="flex items-center gap-2.5">
            <ActionCatalogIcon icon={entry.icon} variant="muted" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 className="text-title-sm font-medium text-muted">{entry.title}</h3>
              <span className="shrink-0 rounded-pill bg-canvas-soft px-2 py-0.5 text-xs text-muted-soft">
                Coming soon
              </span>
            </div>
          </div>

          <p className="mt-2 flex-1 pl-[2.875rem] text-body-sm leading-relaxed text-muted-soft">
            {entry.description}
          </p>

          <p className="mt-3 text-right text-caption text-muted-soft">
            Not available yet
          </p>
        </div>
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-xl border border-hairline bg-surface-card p-4 text-left",
        "transition-all duration-200",
        "hover:border-hairline-strong/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong/10 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <ActionCatalogIcon icon={entry.icon} />
        {configured ? (
          <span className="shrink-0 rounded-full bg-surface-strong px-2 py-0.5 text-caption text-body ring-1 ring-inset ring-hairline">
            Enabled
          </span>
        ) : null}
      </div>
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
