"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right;
 *            the 650ms cycle is shorter than the sweep, so
 *            two fronts are always in flight
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 *
 * Cells paint with `bg-current`, so they inherit whatever the
 * surrounding surface sets (white inside the primary send
 * button, ink inside the chat widget). `tone` only drives the
 * shimmering label and the optional elapsed timer.
 * ───────────────────────────────────────────────────────── */

export type LoadingStateVariant = "Drive" | "Dots" | "Orbit";
export type LoadingStateTone = "light" | "dark";
export type LoadingStateSize = "sm" | "md";

const chevron = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return (col + Math.abs(row - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS: Record<
  LoadingStateVariant,
  { delays: (number | null)[]; duration: number; round: boolean }
> = {
  Drive: { delays: chevron, duration: 650, round: false },
  Dots: { delays: chevron, duration: 650, round: true },
  Orbit: { delays: orbit, duration: 950, round: false },
};

const TONES: Record<LoadingStateTone, { ink: string; muted: string }> = {
  light: { ink: "#0c0a09", muted: "#777169" },
  dark: { ink: "#fafaf9", muted: "#a8a29e" },
};

const CELL_SIZES: Record<LoadingStateSize, { cell: number; gap: number }> = {
  md: { cell: 4, gap: 1.5 },
  sm: { cell: 3, gap: 1 },
};

function Elapsed() {
  const [tenths, setTenths] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTenths((t) => t + 1), 100);
    return () => window.clearInterval(timer);
  }, []);

  const total = tenths / 10;
  const value =
    total < 60
      ? `${total.toFixed(1)}s`
      : `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;

  return (
    <span
      className="font-mono text-[12px] tabular-nums"
      style={{ color: "var(--loader-muted)" }}
    >
      {value}
    </span>
  );
}

export type LoadingStateProps = {
  /** Set to `null` for a purely decorative inline loader. */
  label?: string | null;
  variant?: LoadingStateVariant;
  tone?: LoadingStateTone;
  /** Elapsed timer — off by default so customer-facing chats don't expose latency. */
  showElapsed?: boolean;
  size?: LoadingStateSize;
  className?: string;
};

export function LoadingState({
  label = "Thinking",
  variant = "Drive",
  tone = "light",
  showElapsed = false,
  size = "md",
  className,
}: LoadingStateProps) {
  const { delays, duration, round } = PATTERNS[variant];
  const { cell, gap } = CELL_SIZES[size];
  const palette = TONES[tone];
  const hasLabel = Boolean(label);

  return (
    <span
      className={cn("inline-flex w-fit items-center gap-2.5", className)}
      role={hasLabel ? "status" : undefined}
      aria-live={hasLabel ? "polite" : undefined}
      aria-label={hasLabel ? (label ?? undefined) : undefined}
      aria-hidden={hasLabel ? undefined : true}
      style={
        hasLabel
          ? ({
              "--loader-ink": palette.ink,
              "--loader-muted": palette.muted,
              color: palette.ink,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span
        aria-hidden
        className="grid shrink-0"
        style={{ gridTemplateColumns: `repeat(3, ${cell}px)`, gap }}
      >
        {delays.map((delay, i) => (
          <span
            key={i}
            className={cn(
              "bg-current",
              delay !== null && "loading-state__cell",
              round ? "rounded-full" : "rounded-[1px]",
            )}
            style={
              {
                width: cell,
                height: cell,
                opacity: delay === null ? 0.07 : 0.15,
                "--cell-delay": `${delay ?? 0}ms`,
                "--cell-duration": `${duration}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>

      {hasLabel ? (
        <span className="loading-state__label text-caption font-medium">
          {label}
        </span>
      ) : null}

      {hasLabel && showElapsed ? <Elapsed /> : null}
    </span>
  );
}
