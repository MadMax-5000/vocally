import { SkeletonBlock, SkeletonCard } from "@/components/ui/loading-skeleton";

export default function BillingLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-6 w-28" />
        <SkeletonBlock className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonCard className="mt-2" />
    </div>
  );
}
