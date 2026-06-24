import { SkeletonBlock } from "@/components/ui/loading-skeleton";

export default function InboxLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-6 w-20" />
        <SkeletonBlock className="h-8 w-32" />
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={[
              "flex items-center gap-4 px-4 py-3",
              i < 7 ? "border-b border-hairline" : "",
            ].join(" ")}
          >
            <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-3 w-1/3" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
            <SkeletonBlock className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
