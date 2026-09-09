"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { EASE_OUT } from "@/components/marketing/agent-lifecycle/visuals/shared";
import { cn } from "@/lib/utils";

const ChatVisual = dynamic(() =>
  import("./visuals/ChatVisual").then((mod) => mod.ChatVisual)
);
const EmailVisual = dynamic(() =>
  import("./visuals/EmailVisual").then((mod) => mod.EmailVisual)
);
const VoiceVisual = dynamic(() =>
  import("./visuals/VoiceVisual").then((mod) => mod.VoiceVisual)
);

export type ChannelStepKey = "chat" | "email" | "voice";

export type ChannelStep = {
  id: ChannelStepKey;
  label: string;
};

const STEP_MS = 5000;
const PAUSE_MS = 8000;

type Props = {
  title: string;
  steps: ChannelStep[];
};

function ChannelVisual({ id }: { id: ChannelStepKey }) {
  if (id === "chat") return <ChatVisual />;
  if (id === "email") return <EmailVisual />;
  return <VoiceVisual />;
}

export function DeployChannelsClient({ title, steps }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const locale = useLocale();
  const rtl = locale === "ar";

  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const elapsedRef = useRef(0);
  const pausedUntilRef = useRef(0);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  const current = steps[active] ?? steps[0];
  const panelId = "deploy-channel-panel";

  const selectStep = (index: number, fromUser = false) => {
    if (index === active) return;
    if (fromUser) pausedUntilRef.current = performance.now() + PAUSE_MS;
    elapsedRef.current = 0;
    setActive(index);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: [0, 0.15, 0.4] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView || steps.length < 2) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (now >= pausedUntilRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= STEP_MS) {
          elapsedRef.current = 0;
          setActive((i) => (i + 1) % steps.length);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, steps.length]);

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = steps.length;
    if (count === 0) return;

    let next: number | null = null;
    if (event.key === "ArrowRight") {
      next = (active + (rtl ? -1 : 1) + count) % count;
    } else if (event.key === "ArrowLeft") {
      next = (active + (rtl ? 1 : -1) + count) % count;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = count - 1;
    }

    if (next === null) return;
    event.preventDefault();
    selectStep(next, true);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="deploy-channels" ref={sectionRef} className="bg-surface-card">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 py-section">
        <h2 className="max-w-[20ch] text-center text-[2rem] leading-[1.15] tracking-[-0.025em] text-ink text-balance md:text-[2.5rem]">
          {title}
        </h2>

        <div
          role="tablist"
          aria-label={title}
          onKeyDown={onTabKeyDown}
          className="mt-8 grid w-full max-w-[28rem] grid-cols-3 rounded-full bg-surface-strong p-1 ring-1 ring-inset ring-hairline"
        >
          {steps.map((step, index) => {
            const isActive = index === active;
            return (
              <button
                key={step.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`deploy-channel-tab-${step.id}`}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectStep(index, true)}
                className={cn(
                  "relative z-0 rounded-full px-3 py-2 text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors sm:text-[14px]",
                  isActive ? "text-ink" : "text-muted hover:text-body"
                )}
              >
                {isActive ? (
                  reduceMotion ? (
                    <span
                      className="absolute inset-0 -z-10 rounded-full bg-surface-card shadow-[0_1px_4px_rgba(12,10,9,0.08)]"
                      aria-hidden
                    />
                  ) : (
                    <motion.span
                      layoutId="deploy-channel-tab"
                      className="absolute inset-0 -z-10 rounded-full bg-surface-card shadow-[0_1px_4px_rgba(12,10,9,0.08)]"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      aria-hidden
                    />
                  )
                ) : null}
                <span className="relative">{step.label}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={current ? `deploy-channel-tab-${current.id}` : undefined}
          className="mt-3 w-full overflow-hidden rounded-xxl border border-hairline bg-surface-card shadow-[0_8px_32px_rgba(12,10,9,0.06)]"
        >
          <div className="relative min-h-[420px] bg-surface-strong/60 sm:min-h-[500px] lg:min-h-[540px]">
            <AnimatePresence mode="wait" initial={false}>
              {current ? (
                <motion.div
                  key={current.id}
                  className="absolute inset-0 flex items-center justify-center p-5 sm:p-8 lg:p-10"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE_OUT }}
                >
                  <div className="pointer-events-none flex w-full justify-center select-none" aria-hidden>
                    <ChannelVisual id={current.id} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
