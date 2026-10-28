"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Content-visibility note (do not "optimise" this back into a mount guard).
 *
 * Sections used to render `null` until an IntersectionObserver fired. That kept the
 * reveal tidy, but it also meant every section below the hero (pricing, FAQ, security,
 * footer links) existed only inside the React payload and never in the served HTML.
 * Crawlers that do not execute JavaScript - which includes most AI and answer-engine
 * crawlers - therefore saw a hero and nothing else.
 *
 * Sections now always render their content, and the reveal is armed *after* hydration
 * so the animation is unchanged for people. Sections that are already on screen when
 * the page hydrates are never hidden, so nothing flashes.
 */
function useArmedReveal(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen at hydration: leave it alone so there is no flash of hidden copy.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setArmed(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: "20% 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return { ref, hidden: armed && !shown, armed };
}

type ScrollRevealProps = {
  /** Optional anchor target, e.g. for in-page nav links. */
  id?: string;
  children: ReactNode;
  className?: string;
  /** When false, children render immediately with no reveal. Default true. */
  lazy?: boolean;
  /** Lighter motion for the footer. */
  intensity?: "default" | "light";
};

export function ScrollReveal({
  id,
  children,
  className,
  lazy = true,
  intensity = "default",
}: ScrollRevealProps) {
  const { ref, hidden, armed } = useArmedReveal(lazy);
  const y = intensity === "light" ? 16 : 28;
  const duration = intensity === "light" ? 0.5 : 0.65;

  return (
    <div
      ref={ref}
      id={id}
      className={cn(hidden && "will-change-transform", className)}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${y}px, 0)` : "none",
        transition: armed
          ? `opacity ${duration}s ${EASE}, transform ${duration}s ${EASE}`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, hidden, armed } = useArmedReveal(true);

  return (
    <div ref={ref} className={className}>
      {Children.map(children, (child, index) => {
        const delay = armed ? index * 0.12 : 0;
        return (
          <div
            className={cn(hidden && "will-change-transform")}
            style={{
              opacity: hidden ? 0 : 1,
              transform: hidden ? "translate3d(0, 22px, 0)" : "none",
              transition: armed
                ? `opacity 0.55s ${EASE} ${delay}s, transform 0.55s ${EASE} ${delay}s`
                : undefined,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
