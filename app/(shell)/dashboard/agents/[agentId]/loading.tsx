import { SkeletonBlock, SkeletonAvatar } from "@/components/ui/loading-skeleton";

export default function AgentDetailLoading() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <SkeletonAvatar className="h-10 w-10" />
        <div className="space-y-1.5">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-hairline pb-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-24 rounded-t-md rounded-b-none" />
        ))}
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
