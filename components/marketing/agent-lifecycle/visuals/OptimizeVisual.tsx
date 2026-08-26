"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { DashIn, EASE_OUT, MockCard } from "./shared";

function useCountUp(to: number, delayMs: number, durationMs = 850) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    let raf = 0;
    const startAt = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / durationMs));
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delayMs, durationMs, reduce]);

  return value;
}

const CHART_D =
  "M 40 92 C 72 88, 88 70, 112 74 C 140 79, 156 108, 184 86 C 208 68, 228 52, 256 58 C 284 64, 300 42, 328 36 C 348 31, 360 48, 372 22";

const FEEDBACK = [
  { label: "Positive", value: 643, color: "#5ABF8A" },
  { label: "Neutral", value: 281, color: "#d6d3d1" },
  { label: "Negative", value: 89, color: "#E67474" },
] as const;

const RATINGS = [
  { stars: 5, count: 248 },
  { stars: 4, count: 164 },
  { stars: 3, count: 97 },
  { stars: 2, count: 41 },
  { stars: 1, count: 18 },
] as const;

function Star() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
      <path
        d="M6 0.8 7.4 4.2 11.2 4.6 8.4 7.1 9.2 10.8 6 8.9 2.8 10.8 3.6 7.1 0.8 4.6 4.6 4.2Z"
        fill="#FF7A45"
      />
    </svg>
  );
}

export function OptimizeVisual() {
  const reduce = useReducedMotion();
  const positive = useCountUp(713, 180);
  const neutral = useCountUp(361, 260);
  const negative = useCountUp(120, 340);

  return (
    <DashIn delay={0.05} className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
      <MockCard className="overflow-hidden p-0">
        <div className="grid grid-cols-3 divide-x divide-hairline px-1 pt-4 pb-3">
          {[
            { label: "Positive", value: positive },
            { label: "Neutral", value: neutral },
            { label: "Negative", value: negative },
          ].map((cell) => (
            <div key={cell.label} className="px-4">
              <p className="text-[11px] text-muted">{cell.label}</p>
              <p className="mt-1 text-[22px] font-semibold tabular-nums leading-none tracking-tight text-ink">
                {cell.value}
              </p>
            </div>
          ))}
        </div>

        <div className="px-4 pb-3">
          <svg viewBox="0 0 380 128" className="h-[148px] w-full" aria-hidden>
            {[20, 56, 92].map((y, i) => (
              <g key={y}>
                <line x1="36" x2="372" y1={y} y2={y} stroke="#f0efed" strokeWidth="1" />
                <text x="0" y={y + 3} fill="#a8a29e" fontSize="9">
                  {["100%", "50%", "0%"][i]}
                </text>
              </g>
            ))}
            <motion.path
              d={CHART_D}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.25"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.55, delay: 0.28, ease: EASE_OUT }}
            />
            {["Apr 11", "Apr 13", "Apr 15", "Apr 17"].map((label, i) => (
              <text key={label} x={48 + i * 100} y={122} fill="#a8a29e" fontSize="9">
                {label}
              </text>
            ))}
          </svg>
        </div>
      </MockCard>

      <div className="grid grid-cols-2 gap-3">
        <MockCard className="flex h-full flex-col p-4">
          <p className="text-[13px] font-semibold text-ink">User feedback</p>
          <div className="flex flex-1 items-center justify-center gap-4">
            <FeedbackDonut />
            <ul className="min-w-0 space-y-2">
              {FEEDBACK.map((row) => (
                <li key={row.label} className="flex items-start gap-1.5">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: row.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] leading-none text-muted">{row.label}</p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums leading-none text-ink">
                      {row.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </MockCard>

        <MockCard className="p-3">
          <p className="text-[13px] font-semibold text-ink">Conversations</p>
          <ul className="mt-3 space-y-1.5">
            {RATINGS.map((row) => (
              <li
                key={row.stars}
                className="flex items-center justify-between gap-2 rounded-pill bg-[#FDE8E0] px-2.5 py-1.5"
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: row.stars }, (_, i) => (
                    <Star key={i} />
                  ))}
                </span>
                <span className="text-[11px] font-medium tabular-nums text-ink">{row.count}</span>
              </li>
            ))}
          </ul>
        </MockCard>
      </div>
    </DashIn>
  );
}

function FeedbackDonut() {
  const reduce = useReducedMotion();
  const r = 34;
  const c = 2 * Math.PI * r;
  const total = FEEDBACK.reduce((sum, row) => sum + row.value, 0);

  let offset = 0;
  const segments = FEEDBACK.map((row) => {
    const len = (row.value / total) * c;
    const seg = { ...row, len, offset };
    offset += len;
    return seg;
  });

  return (
    <svg viewBox="0 0 96 96" className="h-[118px] w-[118px] shrink-0" aria-hidden>
      <g transform="translate(48 48) rotate(-90)">
        {segments.map((seg) => (
          <motion.circle
            key={seg.label}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${seg.len} ${c}`}
            strokeDashoffset={-seg.offset}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: -seg.offset }}
            transition={{ duration: 1.1, delay: 0.4, ease: EASE_OUT }}
          />
        ))}
      </g>
    </svg>
  );
}
