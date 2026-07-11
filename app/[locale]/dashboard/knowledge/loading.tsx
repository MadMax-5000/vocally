import { SkeletonBlock, SkeletonCard } from "@/components/ui/loading-skeleton";

export default function KnowledgeLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-8 w-28" />
      </div>

      <SkeletonBlock className="h-9 w-full max-w-md" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
