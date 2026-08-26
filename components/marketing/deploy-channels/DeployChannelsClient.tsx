"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Link } from "@/i18n/routing";
import { DiamondOverlay, EASE_OUT, RAIL_COLOR } from "@/components/marketing/agent-lifecycle/visuals/shared";

import { ChatVisual } from "./visuals/ChatVisual";
import { EmailVisual } from "./visuals/EmailVisual";
import { VoiceVisual } from "./visuals/VoiceVisual";

export type ChannelStepKey = "chat" | "email" | "voice";

export type ChannelStep = {
  id: ChannelStepKey;
  number: string;
  label: string;
  body: string;
  background: string;
};

const STEP_MS = 4000;

const ACCORDION = {
  duration: 0.36,
  ease: EASE_OUT,
} as const;

type Props = {
  title: string;
  cta: string;
  steps: ChannelStep[];
};

export function DeployChannelsClient({ title, cta, steps }: Props) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const inViewRef = useRef(false);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  const setBar = useCallback((value: number) => {
    progressRef.current = value;
    if (barRef.current) {
      barRef.current.style.transform = `scaleY(${value})`;
    }
  }, []);

  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  useLayoutEffect(() => {
    setBar(0);
  }, [active, setBar]);

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
    if (reduceMotion) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (inViewRef.current) {
        const next = Math.min(1, progressRef.current + dt / STEP_MS);
        if (next >= 1) {
          setBar(0);
          setActive((i) => (i + 1) % steps.length);
        } else {
          setBar(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, setBar, steps.length]);

  const selectStep = (index: number) => {
    if (index === active) return;
    setActive(index);
  };

  const current = steps[active] ?? steps[0];

  return (
    <section
      id="deploy-channels"
      ref={sectionRef}
      className="border-t border-hairline bg-surface-card"
    >
      <div className="mx-auto grid w-full max-w-[1200px] items-stretch gap-8 px-6 py-section lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
        <div className="relative order-2 min-h-[480px] overflow-hidden rounded-xxl sm:min-h-[540px] lg:order-1 lg:min-h-[620px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE_OUT }}
            >
              <Image
                src={current.background}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 560px, 100vw"
                priority={current.id === "chat"}
              />
              <DiamondOverlay />
              <div
                className="relative z-10 flex h-full items-center justify-center p-5 sm:p-8 lg:p-10"
                aria-hidden
              >
                <div className="pointer-events-none flex w-full justify-center select-none">
                  {current.id === "chat" ? <ChatVisual /> : null}
                  {current.id === "email" ? <EmailVisual /> : null}
                  {current.id === "voice" ? <VoiceVisual /> : null}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="order-1 flex flex-col lg:order-2">
          <h2 className="font-sans text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-ink md:text-[2.5rem]">
            {title}
          </h2>

          <ol className="mt-10 flex flex-col">
            {steps.map((step, index) => {
              const isActive = index === active;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => selectStep(index)}
                    aria-current={isActive ? "step" : undefined}
                    className="relative w-full py-3 ps-5 text-start"
                  >
                    <span
                      className="absolute start-0 top-3 bottom-3 w-[3px] overflow-hidden rounded-full bg-hairline"
                      aria-hidden
                    >
                      {isActive ? (
                        <span
                          ref={barRef}
                          className="absolute inset-x-0 top-0 h-full rounded-full will-change-transform"
                          style={{
                            backgroundColor: RAIL_COLOR,
                            transform: reduceMotion ? "scaleY(1)" : "scaleY(0)",
                            transformOrigin: "top",
                          }}
                        />
                      ) : null}
                    </span>

                    <span
                      className={[
                        "block text-[15px] font-medium tracking-tight transition-colors",
                        isActive ? "text-ink" : "text-muted-soft",
                      ].join(" ")}
                    >
                      <span className="tabular-nums">{step.number}</span>{" "}
                      {step.label}
                    </span>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          key={`${step.id}-body`}
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={reduceMotion ? { duration: 0 } : ACCORDION}
                          className="overflow-hidden"
                        >
                          <p className="max-w-[34ch] pt-2 pb-1 text-[13.5px] leading-[1.55] text-muted">
                            {step.body}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-8">
            <Link className="btn-primary" href="/sign-up">
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
