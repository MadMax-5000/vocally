import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Frosted-glass frame: a translucent white band wrapping a near-opaque surface.
 * Used over the painted card artwork in the landing sections.
 */
export function FrostedPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-white/55 bg-white/35 p-1.5 shadow-[0_18px_44px_-20px_rgba(35,31,24,0.4)] backdrop-blur-md",
        className,
      )}
    >
      <div className="rounded-[15px] bg-[#FCFBF8] p-3">{children}</div>
    </div>
  );
}
