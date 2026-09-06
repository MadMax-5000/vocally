"use client";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import type { ReactNode } from "react";

/** Immediate (non-lazy) reveal for the hero copy column. */
export function HeroCopyReveal({ children }: { children: ReactNode }) {
  return (
    <ScrollReveal lazy={false} intensity="light" minHeight={0}>
      {children}
    </ScrollReveal>
  );
}
