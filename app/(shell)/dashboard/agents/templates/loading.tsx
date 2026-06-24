import { SkeletonBlock, SkeletonCard } from "@/components/ui/loading-skeleton";

export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-6 px-1 py-2">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <SkeletonBlock className="h-6 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
