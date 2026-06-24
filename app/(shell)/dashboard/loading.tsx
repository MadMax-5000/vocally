import { SkeletonStatCard, SkeletonBlock } from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <SkeletonBlock className="mb-4 h-4 w-1/4" />
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
