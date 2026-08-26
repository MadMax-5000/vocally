"use client";

import { useEffect, useState } from "react";

import { DashIn, MockCard } from "./shared";

const QUESTIONS = [
  "What payment options do you offer?",
  "Do you offer installment plans?",
  "Can I pay with a company invoice?",
  "How do refunds work after 30 days?",
  "Do you accept international cards?",
];

function PassedMark() {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#16a34a]">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e]">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
          <path d="M3 6.2 5.1 8.3 9 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Passed
    </span>
  );
}

function InProgressMark() {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#f97316]">
      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      In-progress
    </span>
  );
}

export function TestVisual() {
  const [firstPassed, setFirstPassed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setFirstPassed(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <DashIn delay={0.05} className="mx-auto w-full max-w-[440px]">
      <MockCard className="p-0">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div>
            <p className="text-[14px] font-semibold leading-none text-ink">9 questions</p>
            <p className="mt-1.5 text-[12px] text-muted">Testing as Floyd Miles</p>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-hairline bg-surface-card px-2.5 text-[12px] font-medium text-ink">
            + Add question
          </span>
        </div>

        <div className="px-4 pb-2">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-hairline pb-1.5 text-[11px] font-medium text-muted">
            <span>Question</span>
            <span className="w-[7.25rem]">Status</span>
          </div>

          <ul>
            {QUESTIONS.map((q, i) => (
              <DashIn key={q} delay={0.12 + i * 0.08}>
                <li className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-hairline-soft py-2.5 last:border-b-0">
                  <span className="truncate text-[12.5px] text-ink">{q}</span>
                  <span className="w-[7.25rem]">
                    {i === 0 && firstPassed ? <PassedMark /> : <InProgressMark />}
                  </span>
                </li>
              </DashIn>
            ))}
          </ul>
        </div>
      </MockCard>
    </DashIn>
  );
}
