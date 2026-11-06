"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const PRIMARY = "#FF5A06";
const GRID = "#e7e5e4";
const LABEL = "#8a8377";
const MAX_VALUE = 80;

type Sample = { month: string; value: number };

/** Twelve rolling months — deterministic so server and client markup always agree. */
const SERIES: Sample[] = [
  { month: "2025-10", value: 52.4 },
  { month: "2025-11", value: 54.1 },
  { month: "2025-12", value: 53.2 },
  { month: "2026-01", value: 57.6 },
  { month: "2026-02", value: 59.8 },
  { month: "2026-03", value: 58.4 },
  { month: "2026-04", value: 62.9 },
  { month: "2026-05", value: 65.7 },
  { month: "2026-06", value: 64.8 },
  { month: "2026-07", value: 70.2 },
  { month: "2026-08", value: 74.6 },
  { month: "2026-09", value: 78.4 },
];

const TARGET = SERIES[SERIES.length - 1].value;
const TICKS = [0, 20, 40, 60, 80];

type Props = {
  locale: string;
  metricLabel: string;
  legend: string;
  chartAria: string;
};

function monthLabel(month: string, locale: string) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(date);
  } catch {
    return month.slice(5);
  }
}

/** Catmull-Rom to cubic bezier — the soft curve the reference chart has. */
function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(query.matches);
    const onChange = () => setReduce(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduce;
}

export function ResolutionChart({ locale, metricLabel, legend, chartAria }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId]);

  const reduceMotion = useReducedMotion();

  const [size, setSize] = useState({ width: 660, height: 296 });
  const [played, setPlayed] = useState(false);
  const [display, setDisplay] = useState(TARGET);

  // Match the viewBox to the rendered box so axis text keeps a constant pixel size.
  useEffect(() => {
    const el = plotRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(260, Math.round(entry.contentRect.width));
      const height = width < 460 ? 220 : width < 820 ? 280 : 340;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Arm the reveal: hold the metric at zero until the card is actually on screen.
  useEffect(() => {
    if (reduceMotion) {
      setDisplay(TARGET);
      setPlayed(true);
      return;
    }
    if (!played) setDisplay(0);
  }, [played, reduceMotion]);

  useEffect(() => {
    if (played || reduceMotion) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setPlayed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPlayed(true);
        observer.disconnect();
      },
      { threshold: 0.3, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [played, reduceMotion]);

  useEffect(() => {
    if (!played || reduceMotion) return;
    let frame = 0;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(TARGET * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [played, reduceMotion]);

  const { width, height } = size;
  const pad = { top: 18, right: 12, bottom: 30, left: width < 460 ? 38 : 46 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const baseline = pad.top + innerHeight;

  const points = useMemo(
    () =>
      SERIES.map((sample, index) => ({
        ...sample,
        x: pad.left + (index / (SERIES.length - 1)) * innerWidth,
        y: pad.top + (1 - sample.value / MAX_VALUE) * innerHeight,
      })),
    [innerWidth, innerHeight, pad.left, pad.top]
  );

  const line = useMemo(() => smoothPath(points), [points]);
  const area = useMemo(() => {
    if (!line) return "";
    const last = points[points.length - 1];
    return `${line} L ${last.x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }, [line, points, baseline]);

  const lastPoint = points[points.length - 1];
  const labelFontSize = width < 460 ? 9.5 : 10.5;
  const yFontSize = width < 460 ? 9.5 : 10.5;

  const revealStyle = {
    transform: played ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: `${pad.left}px 0px`,
    transition: reduceMotion ? undefined : "transform 1.9s cubic-bezier(0.22, 1, 0.36, 1)",
  } as const;

  return (
    <div ref={rootRef} className="flex flex-col">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.96px] text-muted">
          {metricLabel}
        </p>
        <p className="mt-2 flex items-baseline font-display text-[42px] leading-none tracking-[-1.6px] text-ink">
          <span className="tabular-nums">{display.toFixed(1)}</span>
          <span className="ms-0.5 text-[24px] leading-none text-warm-body">%</span>
        </p>
      </div>

      <div ref={plotRef} dir="ltr" className="mt-5">
        <svg
          role="img"
          aria-label={chartAria}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
        >
          <title>{chartAria}</title>
          <defs>
            <clipPath id={`${uid}-clip`} clipPathUnits="userSpaceOnUse">
              <rect
                x={pad.left}
                y={0}
                width={width - pad.left}
                height={height}
                style={revealStyle}
              />
            </clipPath>
            <linearGradient
              id={`${uid}-fill`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={pad.top}
              x2={0}
              y2={baseline}
            >
              <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.9" />
              <stop offset="48%" stopColor={PRIMARY} stopOpacity="0.42" />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid + labels arrive just ahead of the curve. */}
          <g
            style={{
              opacity: played ? 1 : 0,
              transition: reduceMotion ? undefined : "opacity 0.7s ease-out 0.1s",
            }}
          >
            {TICKS.map((tick) => {
              const y = pad.top + (1 - tick / MAX_VALUE) * innerHeight;
              return (
                <g key={tick}>
                  <line
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={y}
                    y2={y}
                    stroke={GRID}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                  />
                  <text
                    x={pad.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize={yFontSize}
                    fill={LABEL}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {points.map((point, index) => (
              <g key={point.month}>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={pad.top}
                  y2={baseline}
                  stroke={GRID}
                  strokeWidth={1}
                  strokeDasharray="3 4"
                  opacity={0.55}
                />
                <text
                  x={point.x}
                  y={baseline + 17}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fill={LABEL}
                  style={{
                    opacity: played ? 1 : 0,
                    transition: reduceMotion
                      ? undefined
                      : `opacity 0.5s ease-out ${0.15 + index * 0.05}s`,
                  }}
                >
                  {monthLabel(point.month, locale)}
                </text>
              </g>
            ))}
          </g>

          {/* The curve wipes in from the left once, then stays put. */}
          <g clipPath={`url(#${uid}-clip)`}>
            <path d={area} fill={`url(#${uid}-fill)`} />
            <path
              d={line}
              fill="none"
              stroke={PRIMARY}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point) => (
              <circle
                key={point.month}
                cx={point.x}
                cy={point.y}
                r={1.8}
                fill={PRIMARY}
                stroke="#ffffff"
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Latest reading — the only emphasised point. */}
          <g
            style={{
              opacity: played ? 1 : 0,
              transform: played ? "scale(1)" : "scale(0.6)",
              transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
              transition: reduceMotion
                ? undefined
                : "opacity 0.45s ease-out 1.7s, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 1.7s",
            }}
          >
            <circle cx={lastPoint.x} cy={lastPoint.y} r={9} fill={PRIMARY} opacity={0.16} />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3.6}
              fill={PRIMARY}
              stroke="#ffffff"
              strokeWidth={1.75}
            />
          </g>
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] leading-none text-muted">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: PRIMARY }}
        />
        {legend}
      </div>
    </div>
  );
}
