"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type FaqItem = { key: string; q: string; a: string };

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn(
        "h-4 w-4 shrink-0 text-ink transition-transform duration-300",
        open && "rotate-45",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

/**
 * Answers stay in the DOM while collapsed (a CSS grid-rows transition, not a mount guard),
 * so a crawler that reads the page source can extract every answer even though a person
 * only sees the question until they open it.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="mt-12 grid grid-flow-row-dense items-start gap-4 pb-6 md:grid-cols-2">
      {items.map((item) => {
        const open = openKey === item.key;

        return (
          <div key={item.key} className="rounded-[12px] bg-surface-warm">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`faq-${item.key}`}
              onClick={() => setOpenKey(open ? null : item.key)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[16px] leading-[1.4] text-ink"
            >
              <span>{item.q}</span>
              <PlusIcon open={open} />
            </button>

            <div
              id={`faq-${item.key}`}
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0">
                <p className="px-6 pb-5 text-[15px] leading-[1.6] text-warm-body">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
