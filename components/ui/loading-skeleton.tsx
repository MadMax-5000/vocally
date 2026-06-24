export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-hairline",
        className ?? "",
      ].join(" ")}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={[
        "rounded-xl border border-hairline bg-surface-card p-4",
        className ?? "",
      ].join(" ")}
    >
      <SkeletonBlock className="mb-3 h-3 w-1/3" />
      <SkeletonBlock className="mb-2 h-3 w-full" />
      <SkeletonBlock className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonTitle({ className }: { className?: string }) {
  return <SkeletonBlock className={["h-5 w-1/2", className ?? ""].join(" ")} />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <SkeletonBlock className={["h-3", className ?? ""].join(" ")} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-full bg-hairline",
        className ?? "h-8 w-8",
      ].join(" ")}
    />
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={[
        "rounded-xl border border-hairline bg-surface-card p-4",
        className ?? "",
      ].join(" ")}
    >
      <SkeletonBlock className="mb-2 h-3 w-1/4" />
      <SkeletonBlock className="mb-1 h-7 w-1/3" />
      <SkeletonBlock className="h-2 w-1/2" />
    </div>
  );
}
