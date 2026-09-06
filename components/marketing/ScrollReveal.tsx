"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Reserved space before the section mounts, to avoid CLS. */
  minHeight?: number;
  /** When false, children render immediately (hero copy). Default true. */
  lazy?: boolean;
  /** Lighter motion for the footer. */
  intensity?: "default" | "light";
  stagger?: boolean;
};

export function ScrollReveal({
  children,
  className,
  minHeight = 520,
  lazy = true,
  intensity = "default",
  stagger = false,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: "20% 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, visible]);

  const y = intensity === "light" ? 16 : 28;
  const blur = intensity === "light" ? "4px" : "6px";

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? undefined : { minHeight }}
    >
      {visible ? (
        reduceMotion ? (
          children
        ) : (
          <motion.div
            initial={{ opacity: 0, y, filter: `blur(${blur})` }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: intensity === "light" ? 0.5 : 0.65,
              ease: EASE,
              ...(stagger ? { staggerChildren: 0.12, delayChildren: 0.06 } : {}),
            }}
          >
            {children}
          </motion.div>
        )
      ) : null}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.12, delayChildren: 0.06 }}
    >
      {Children.map(children, (child) => (
        <motion.div
          variants={cardVariants}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
