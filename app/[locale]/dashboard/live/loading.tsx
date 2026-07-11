import { SkeletonBlock, SkeletonCard } from "@/components/ui/loading-skeleton";

export default function LiveLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-8 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="rounded-xl border border-hairline bg-surface-card p-4">
          <SkeletonBlock className="mb-3 h-4 w-1/2" />
          <SkeletonBlock className="mb-2 h-20 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
