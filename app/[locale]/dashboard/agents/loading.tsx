import { SkeletonBlock, SkeletonCard } from "@/components/ui/loading-skeleton";

export default function AgentsLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-24" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-8 w-28" />
        </div>
      </div>

      <SkeletonBlock className="h-9 w-full max-w-md" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
