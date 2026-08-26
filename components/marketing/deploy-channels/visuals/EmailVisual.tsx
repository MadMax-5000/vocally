"use client";

import { motion, useReducedMotion } from "framer-motion";

import { DashIn, EASE_OUT, MockCard } from "@/components/marketing/agent-lifecycle/visuals/shared";

const PARA_1 = ["100%", "92%", "86%", "58%"] as const;
const PARA_2 = ["94%", "80%", "46%"] as const;

function SkeletonLine({ width, delay }: { width: string; delay: number }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className="block h-2.5 origin-start rounded-full bg-hairline-soft"
      style={{ width }}
      initial={reduce ? false : { opacity: 0, scaleX: 0.18 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    />
  );
}

export function EmailVisual() {
  return (
    <DashIn delay={0.04} className="mx-auto w-full max-w-[460px]">
      <MockCard className="overflow-hidden p-0">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </span>
        </div>

        <div className="px-6 pb-5">
          <DashIn delay={0.08}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink">
                {/* Decorative mock chrome */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-white.png" alt="" className="h-5 w-5 object-contain" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-none text-ink">Anselio</p>
                <p className="mt-1.5 text-[12px] leading-none text-muted">
                  To: Customer &lt;johndoe@example.com&gt;
                </p>
              </div>
            </div>
          </DashIn>

          <div className="mt-7 space-y-2.5">
            {PARA_1.map((width, i) => (
              <SkeletonLine key={`p1-${width}`} width={width} delay={0.18 + i * 0.08} />
            ))}
          </div>

          <div className="mt-6 space-y-2.5">
            {PARA_2.map((width, i) => (
              <SkeletonLine key={`p2-${width}`} width={width} delay={0.52 + i * 0.08} />
            ))}
          </div>

          <DashIn delay={0.82}>
            <div className="mt-8 space-y-1.5">
              <p className="text-[12px] text-muted-soft">Powered by AI</p>
              <p className="text-[13px] leading-snug text-body">Thanks,</p>
              <p className="text-[13px] font-medium leading-snug text-ink">Anselio</p>
            </div>
          </DashIn>
        </div>
      </MockCard>
    </DashIn>
  );
}
