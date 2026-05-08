"use client";

import { cn } from "@/lib/utils";

type ProgressDotsProps = {
  currentIndex: number;
  total: number;
  className?: string;
};

export function ProgressDots({ currentIndex, total, className }: ProgressDotsProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-1.5", className)}
      role="status"
      aria-label={`Step ${currentIndex + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i === currentIndex;
        return (
          <span
            key={i}
            className={cn(
              "rounded-pill transition-all",
              active ? "h-1 w-3 bg-ink" : "h-1 w-1 bg-hairline-strong"
            )}
          />
        );
      })}
    </div>
  );
}
