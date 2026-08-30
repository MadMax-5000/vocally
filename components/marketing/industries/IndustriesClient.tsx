"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { AgentIcon } from "@/components/ui/icons";
import { EASE_OUT, RAIL_COLOR } from "@/components/marketing/agent-lifecycle/visuals/shared";
import { ChevronLeft, ChevronRight } from "@/lib/icons/app-icons";
import { cn } from "@/lib/utils";

import {
  GRAIN_IMAGE,
  INDUSTRY_CARDS,
  type IndustryCopy,
} from "./industry-cards";
import { useTypewriter } from "./use-typewriter";

const ACCORDION_MS = 0.5;
const REPLY_DELAY_MS = 720;
const STEP_MS = 4000;

type Props = {
  title: string;
  agentLabel: string;
  prevLabel: string;
  nextLabel: string;
  cards: IndustryCopy[];
};

export function IndustriesClient({
  title,
  agentLabel,
  prevLabel,
  nextLabel,
  cards,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const inViewRef = useRef(false);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const count = cards.length;

  const setBar = useCallback((value: number) => {
    progressRef.current = value;
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${value})`;
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
          setActive((i) => (i + 1) % count);
        } else {
          setBar(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count, reduceMotion, setBar]);

  const select = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      if (next === active) return;
      setActive(next);
    },
    [active, count]
  );

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="scroll-mt-16 bg-surface-card"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 py-section">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sans text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-ink md:text-[2.5rem]">
            {title}
          </h2>
          <div className="flex shrink-0 gap-2">
            <NavButton
              label={prevLabel}
              onClick={() => select(active - 1)}
            >
              <AppIcon icon={ChevronLeft} size={18} className="rtl:rotate-180" />
            </NavButton>
            <NavButton
              label={nextLabel}
              onClick={() => select(active + 1)}
            >
              <AppIcon icon={ChevronRight} size={18} className="rtl:rotate-180" />
            </NavButton>
          </div>
        </div>

        <div className="mt-8 flex h-[26rem] gap-2.5 sm:h-[28rem] lg:h-[32rem]">
          {cards.map((copy, index) => {
            const def = INDUSTRY_CARDS[index];
            if (!def) return null;
            const isActive = index === active;
            return (
              <IndustryCard
                key={copy.id}
                copy={copy}
                accent={def.accent}
                icon={def.icon}
                image={def.image}
                isActive={isActive}
                reduceMotion={reduceMotion}
                agentLabel={agentLabel}
                onSelect={() => select(index)}
              />
            );
          })}
        </div>

        <div
          className="mx-auto mt-5 h-[3px] w-40 overflow-hidden rounded-full bg-hairline sm:w-48"
          aria-hidden
        >
          <span
            ref={barRef}
            className="block h-full w-full rounded-full origin-left will-change-transform rtl:origin-right"
            style={{
              backgroundColor: RAIL_COLOR,
              transform: reduceMotion ? "scaleX(1)" : "scaleX(0)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline-strong bg-surface-card text-ink transition-colors hover:bg-surface-strong"
    >
      {children}
    </button>
  );
}

function IndustryCard({
  copy,
  accent,
  icon,
  image,
  isActive,
  reduceMotion,
  agentLabel,
  onSelect,
}: {
  copy: IndustryCopy;
  accent: string;
  icon: (typeof INDUSTRY_CARDS)[number]["icon"];
  image: string;
  isActive: boolean;
  reduceMotion: boolean;
  agentLabel: string;
  onSelect: () => void;
}) {
  const duration = reduceMotion ? 0.18 : ACCORDION_MS;

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={copy.label}
      onClick={onSelect}
      className={cn(
        "relative min-h-0 overflow-hidden rounded-xl text-start shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        isActive
          ? "min-w-0 flex-[3.6_1_0%] cursor-default"
          : "hidden cursor-pointer md:block md:min-w-0 md:flex-[1_1_0%]"
      )}
      style={
        {
          "--industry-accent": accent,
          transition: `flex ${duration}s cubic-bezier(${EASE_OUT.join(",")})`,
        } as CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          isActive ? "grayscale-0" : "grayscale"
        )}
        style={{
          transition: `filter ${duration}s cubic-bezier(${EASE_OUT.join(",")})`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: isActive
            ? "linear-gradient(to top, var(--industry-accent) 0%, color-mix(in srgb, var(--industry-accent) 70%, transparent) 22%, color-mix(in srgb, var(--industry-accent) 18%, transparent) 42%, transparent 58%)"
            : "linear-gradient(to top, rgba(12,10,9,0.62) 0%, rgba(12,10,9,0.12) 42%, transparent 70%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.42]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GRAIN_IMAGE} alt="" className="h-full w-full object-cover" />
      </div>

      {isActive ? (
        <IndustryChat
          key={copy.id}
          user={copy.user}
          agent={copy.agent}
          agentLabel={agentLabel}
          reduceMotion={reduceMotion}
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex items-end p-4",
          isActive ? "justify-start" : "justify-center"
        )}
      >
        {isActive ? (
          <span className="flex items-center gap-2 text-on-primary">
            <AppIcon icon={icon} size={20} strokeWidth={1.8} className="shrink-0" />
            <span className="text-title-sm whitespace-nowrap">{copy.label}</span>
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink/25 text-on-primary">
            <AppIcon icon={icon} size={18} strokeWidth={1.8} />
          </span>
        )}
      </div>
    </button>
  );
}

function IndustryChat({
  user,
  agent,
  agentLabel,
  reduceMotion,
}: {
  user: string;
  agent: string;
  agentLabel: string;
  reduceMotion: boolean;
}) {
  const [showReply, setShowReply] = useState(reduceMotion);
  const { shown, done } = useTypewriter(agent, showReply, reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      setShowReply(true);
      return;
    }
    setShowReply(false);
    const id = window.setTimeout(() => setShowReply(true), REPLY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center px-5 sm:px-8 lg:px-10"
      aria-hidden
    >
      <div className="flex w-full max-w-[20rem] flex-col gap-2.5">
        <motion.div
          className="ms-auto max-w-[90%]"
          initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.12, ease: EASE_OUT }}
        >
          <p
            className="rounded-2xl px-3.5 py-2.5 text-[13.5px] font-medium leading-snug text-on-primary"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--industry-accent) 38%, rgb(12 10 9 / 0.62))",
            }}
          >
            {user}
          </p>
        </motion.div>

        {showReply ? (
          <motion.div
            className="max-w-[95%]"
            initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE_OUT }}
          >
            <div className="rounded-2xl bg-surface-card px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <p className="text-[13.5px] leading-snug text-ink">
                {shown}
                {!done ? (
                  <span
                    className="ms-px inline-block h-[0.95em] w-px translate-y-[0.12em] bg-ink/55 align-middle"
                    style={{ animation: "pulse 0.9s ease-in-out infinite" }}
                  />
                ) : null}
              </p>
              {done ? (
                <motion.div
                  className="mt-2 flex items-center gap-1.5 text-muted-soft"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE_OUT }}
                >
                  <AgentIcon className="h-3.5 w-3.5" />
                  <span className="text-[11px] leading-none">{agentLabel}</span>
                </motion.div>
              ) : (
                <div className="mt-2 h-[14px]" />
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
