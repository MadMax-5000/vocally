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

const STATS = [
  { label: "Positive", value: 713, trend: "+12.4%", tone: "up" as const, dot: "#5ABF8A" },
  { label: "Neutral", value: 361, trend: "—", tone: "flat" as const, dot: "#D6D3D1" },
  { label: "Negative", value: 120, trend: "−8.2%", tone: "down" as const, dot: "#E06A6A" },
];

const LEARNINGS = [
  "Refund window is 30 days",
  "Escalate billing disputes",
  "Reply in Darija when asked",
] as const;

const TREND_TONE = {
  up: "bg-[#EAF7EF] text-[#15803D]",
  flat: "bg-[#F4F2EC] text-muted",
  down: "bg-[#FCEDEA] text-[#B4433A]",
};

function Sparkle() {
  return (
    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
      <path d="M6 .7c.3 2.6 1.6 4 4.3 4.3-2.7.3-4 1.7-4.3 4.3C5.7 6.7 4.4 5.3 1.7 5 4.4 4.7 5.7 3.3 6 .7Z" />
    </svg>
  );
}

export function OptimizeVisual() {
  const reduce = useReducedMotion();
  const positive = useCountUp(713, 180);
  const neutral = useCountUp(361, 260);
  const negative = useCountUp(120, 340);
  const score = useCountUp(92, 420);
  const values = [positive, neutral, negative];

  return (
    <DashIn delay={0.05} className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
      <MockCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold leading-none text-ink">Sentiment</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-1.5 py-[3px] text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[#15803D]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              </span>
              Live
            </span>
          </div>
          <span className="rounded-full border border-hairline px-2 py-[3px] text-[9px] text-muted">
            Last 7 days
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 divide-x divide-hairline border-y border-hairline/70">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: stat.dot }}
                />
                <p className="text-[10px] font-medium text-muted">{stat.label}</p>
              </div>
              <div className="mt-1.5 flex items-end justify-between gap-1">
                <p className="text-[22px] font-semibold leading-none tracking-tight tabular-nums text-ink">
                  {values[i]}
                </p>
                <span
                  className={`rounded-[5px] px-1.5 py-[2px] text-[8.5px] font-semibold tabular-nums ${TREND_TONE[stat.tone]}`}
                >
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-2 pt-1">
          <svg viewBox="0 0 380 132" className="w-full" aria-hidden>
            <defs>
              <linearGradient id="optimizeArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5A36" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#FF5A36" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[20, 56, 92].map((y, i) => (
              <g key={y}>
                <line x1="36" x2="372" y1={y} y2={y} stroke="#F0EFED" strokeWidth="1" />
                <text x="0" y={y + 3} fill="#A8A29E" fontSize="9">
                  {["100%", "50%", "0%"][i]}
                </text>
              </g>
            ))}

            <motion.path
              d={`${CHART_D} L 372 92 L 40 92 Z`}
              fill="url(#optimizeArea)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.6, ease: EASE_OUT }}
            />

            <motion.path
              d={CHART_D}
              fill="none"
              stroke="#FF5A36"
              strokeWidth="2.25"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.55, delay: 0.28, ease: EASE_OUT }}
            />

            <text x="372" y="12" textAnchor="end" fill="#FF5A36" fontSize="9" fontWeight="600">
              84%
            </text>

            {reduce ? null : (
              <motion.circle
                cx="372"
                cy="22"
                r="4"
                fill="none"
                stroke="#FF5A36"
                strokeWidth="1.5"
                animate={{ r: [4, 11], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.9 }}
              />
            )}
            <motion.circle
              cx="372"
              cy="22"
              r="4"
              fill="#FF5A36"
              stroke="#FCFBF8"
              strokeWidth="2"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.6, ease: EASE_OUT }}
            />

            {["Apr 11", "Apr 13", "Apr 15", "Apr 17"].map((label, i) => (
              <text key={label} x={48 + i * 100} y={126} fill="#A8A29E" fontSize="9">
                {label}
              </text>
            ))}
          </svg>
        </div>
      </MockCard>

      <div className="grid grid-cols-[0.85fr_1.15fr] gap-3">
        <MockCard className="flex flex-col p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold leading-none text-ink">Quality score</p>
            <span className="text-[#FF5A36]">
              <Sparkle />
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center pt-2">
            <ScoreGauge score={score} />
            <p className="mt-2 text-center text-[10px] font-medium text-[#15803D]">
              +8 pts this week
            </p>
          </div>
        </MockCard>

        <MockCard className="flex h-full flex-col p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold leading-none text-ink">Learned this week</p>
            <span className="rounded-full bg-[#EAF7EF] px-1.5 py-[2px] text-[8.5px] font-semibold text-[#15803D]">
              3 new
            </span>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {LEARNINGS.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-center gap-2 rounded-lg bg-[#FAF8F3] px-2 py-2"
                initial={reduce ? false : { opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.55 + i * 0.12, ease: EASE_OUT }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFEDE6] text-[#FF5A36]">
                  <Sparkle />
                </span>
                <span className="text-[10px] leading-[1.35] text-[#3F3E3A]">{item}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-1.5 border-t border-hairline/70 pt-2 text-[8.5px] font-medium text-muted">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-[#15803D]" fill="none" aria-hidden>
              <path
                d="M2.5 6.2 4.8 8.4 9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Auto-applied to live agent
          </div>
        </MockCard>
      </div>
    </DashIn>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const r = 46;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative h-[104px] w-[104px]">
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#F1EEE7" strokeWidth="9" />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#FF5A36"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - 0.92) }}
            transition={{ duration: 1.3, delay: 0.35, ease: EASE_OUT }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink">
          {score}
        </span>
        <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted">
          Score
        </span>
      </div>
    </div>
  );
}
