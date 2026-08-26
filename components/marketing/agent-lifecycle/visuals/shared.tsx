"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const RAIL_COLOR = "#C026D3";

export function DashIn({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.52, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export function MockCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-card p-4 shadow-[0_8px_28px_rgba(12,10,9,0.10)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MockTitle({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold leading-none text-ink">{children}</p>;
}

export function MockToggle({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300",
        on ? "bg-[#22c55e]" : "bg-[#e4e4e7]"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] start-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300",
          on && "translate-x-4 rtl:-translate-x-4"
        )}
      />
    </span>
  );
}

export function BrandImg({ src, className }: { src: string; className?: string }) {
  return (
    // Decorative mock chrome — next/image is unnecessary for tiny SVGs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn("h-5 w-5 object-contain", className)} aria-hidden />
  );
}

export function DiamondOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.22]"
      style={{
        backgroundImage: [
          "linear-gradient(135deg, transparent 49.4%, rgba(255,255,255,0.55) 49.4%, rgba(255,255,255,0.55) 50.6%, transparent 50.6%)",
          "linear-gradient(45deg, transparent 49.4%, rgba(255,255,255,0.55) 49.4%, rgba(255,255,255,0.55) 50.6%, transparent 50.6%)",
        ].join(","),
        backgroundSize: "168px 168px",
      }}
    />
  );
}
