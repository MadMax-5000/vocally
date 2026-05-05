"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export function RotatingWord({
  words,
  intervalMs = 2200,
  className
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const safeWords = useMemo(() => words.filter(Boolean), [words]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (safeWords.length <= 1) return;
    if (shouldReduceMotion) return;

    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % safeWords.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, safeWords.length, shouldReduceMotion]);

  const current = safeWords.length ? safeWords[idx % safeWords.length] : "";

  if (shouldReduceMotion) {
    return <span className={className}>{current}</span>;
  }

  return (
    <span className={["relative inline-block align-baseline", className ?? ""].join(" ")}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

