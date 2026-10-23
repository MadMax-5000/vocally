"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type FaqItem = { key: string; q: string; a: string };

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

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

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const reduce = useReducedMotion() ?? false;

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

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="answer"
                  id={`faq-${item.key}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.34, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-[15px] leading-[1.6] text-warm-body">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
