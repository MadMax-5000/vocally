import { SkeletonBlock } from "@/components/ui/loading-skeleton";

export default function NewAgentLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-card">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 px-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-72" />

        <div className="mt-4 w-full space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <SkeletonBlock className="mb-1.5 h-3 w-20" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>

        <SkeletonBlock className="mt-2 h-10 w-32" />
      </div>
    </div>
  );
}
