"use client";

import { motion, useReducedMotion } from "framer-motion";

import { DashIn, MockCard } from "@/components/marketing/agent-lifecycle/visuals/shared";

const BARS = [0.42, 0.72, 1, 0.58, 0.88, 0.5, 0.68];

function Waveform() {
  const reduce = useReducedMotion();

  return (
    <div className="flex h-[148px] w-[148px] items-center justify-center rounded-full bg-surface-strong/70">
      <div className="flex h-[72px] items-center gap-[7px]">
        {BARS.map((peak, i) =>
          reduce ? (
            <span
              key={i}
              className="w-[5px] rounded-full bg-ink"
              style={{ height: `${peak * 72}px` }}
            />
          ) : (
            <motion.span
              key={i}
              className="w-[5px] origin-center rounded-full bg-ink"
              style={{ height: 72 }}
              initial={{ scaleY: 0.28 }}
              animate={{ scaleY: [0.28, peak, 0.36, Math.max(0.4, peak * 0.72), 0.28] }}
              transition={{
                duration: 1.15,
                delay: i * 0.07,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function EndIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" aria-hidden>
      <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 12.5a6 6 0 0 0 12 0M12 18.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function VoiceVisual() {
  return (
    <DashIn delay={0.04} className="mx-auto w-full max-w-[360px]">
      <MockCard className="flex min-h-[440px] flex-col items-center px-6 py-8">
        <DashIn delay={0.1}>
          <p className="text-[14px] font-medium tracking-wide text-muted">Live call</p>
        </DashIn>

        <div className="flex flex-1 items-center justify-center py-10">
          <DashIn delay={0.18}>
            <Waveform />
          </DashIn>
        </div>

        <DashIn delay={0.32} className="flex items-center gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hairline text-muted">
            <EndIcon />
          </span>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-on-primary">
            <MicIcon />
          </span>
        </DashIn>
      </MockCard>
    </DashIn>
  );
}
