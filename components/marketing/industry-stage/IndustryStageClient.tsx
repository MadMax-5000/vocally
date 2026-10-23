"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { EASE_OUT } from "@/components/marketing/agent-lifecycle/visuals/shared";
import { AgentIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { type IndustryCopy } from "../industries/industry-cards";
import { useTypewriter } from "../industries/use-typewriter";

const AUTOPLAY_MS = 5000;
const REPLY_DELAY_MS = 720;
const REVEAL_FROM = "#CBC5B9";
const REVEAL_TO = "#0c0a09";

/** One shared artwork, shown in full at its natural aspect ratio. */
const STAGE_IMAGE = "/images/cards-background8.png";

const REVEAL_CLASS =
  "mx-auto max-w-[62rem] text-balance text-center font-display font-normal text-[30px] leading-[1.2] tracking-[-1.5px] text-ink sm:text-[38px] sm:leading-[1.16] lg:text-[44px] lg:leading-[1.14] lg:tracking-[-1.8px]";

type Props = {
  title: string;
  agentLabel: string;
  reveal: string;
  cards: IndustryCopy[];
};

export function IndustryStageClient({ title, agentLabel, reveal, cards }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);

  const count = cards.length;
  const current = cards[active] ?? cards[0];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: [0, 0.12, 0.35] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView || paused || locked || count < 2) return;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, inView, locked, paused, reduceMotion]);

  const select = useCallback(
    (index: number) => {
      setActive((index + count) % count);
      setLocked(true);
    },
    [count]
  );

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const rtl = document.documentElement.dir === "rtl";
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const next = (active + (forward ? 1 : -1) + count) % count;
    select(next);
    tabRefs.current[next]?.focus();
  };

  if (!current) return null;

  return (
    <section
      id="industries"
      ref={sectionRef}
      aria-labelledby="industry-stage-heading"
      className="relative scroll-mt-16 overflow-hidden bg-canvas-warm"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 py-[6rem] sm:py-[9rem]">
        <p className="flex items-center justify-center gap-2 text-[13px] font-medium leading-none text-warm-body">
          <span aria-hidden className="size-1 rounded-full bg-warm-body" />
          {title}
        </p>

        <div className="mt-5">
          <RevealHeading text={reveal} reduceMotion={reduceMotion} />
        </div>

        <div
          className="mt-10 sm:mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            role="tablist"
            aria-label={title}
            onKeyDown={onTabKeyDown}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {cards.map((card, index) => {
              const selected = index === active;
              return (
                <button
                  key={card.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`industry-tab-${card.id}`}
                  aria-selected={selected}
                  aria-controls="industry-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(index)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center justify-center rounded-pill px-4 text-[13.5px] font-normal transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/35 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-warm",
                    selected
                      ? "bg-ink text-white shadow-[0_6px_18px_-8px_rgba(12,10,9,0.6)]"
                      : "border border-hairline-strong bg-white/80 text-warm-body hover:bg-white hover:text-ink"
                  )}
                >
                  {card.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="industry-panel"
            aria-labelledby={`industry-tab-${current.id}`}
            className="mx-auto mt-6 w-full max-w-[1000px] rounded-[24px] bg-surface-warm p-2.5 shadow-[0_34px_80px_-58px_rgba(35,31,24,0.55)] sm:p-3 lg:mt-8 lg:p-4"
          >
            <div className="relative isolate aspect-[1672/941] w-full overflow-hidden rounded-[16px] bg-[#141210]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  className="absolute inset-0"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_OUT }}
                >
                  {/* The painting itself — full image, gentle drift. */}
                  <motion.div
                    className="absolute -inset-[8%]"
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            scale: [1.02, 1.05],
                            x: ["-0.6%", "0.6%"],
                            y: ["0.4%", "-0.4%"],
                          }
                    }
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                  >
                    <Image
                      src={STAGE_IMAGE}
                      alt=""
                      aria-hidden
                      fill
                      unoptimized
                      sizes="(min-width: 1040px) 968px, (min-width: 640px) 86vw, 100vw"
                      className="object-cover"
                    />
                  </motion.div>

                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/35"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.25)_100%)]"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Identity — a quiet index. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-3 p-4 sm:p-5">
                <span
                  dir="ltr"
                  className="tabular mt-1 shrink-0 text-[10.5px] font-medium leading-none tracking-[0.2em] text-white/70"
                >
                  {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 bottom-4 z-0 hidden font-display text-[28px] leading-none tracking-[-0.03em] text-white/15 lg:block lg:text-[30px]"
              >
                {current.label}
              </div>

              <div className="absolute inset-0 flex items-center justify-center px-5 pt-10 sm:px-8 lg:px-10 lg:pt-4">
                <IndustryConversation
                  key={current.id}
                  user={current.user}
                  agent={current.agent}
                  agentLabel={agentLabel}
                  reduceMotion={reduceMotion}
                />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/45"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Scroll-driven ink reveal ─── */

function RevealHeading({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["center 0.55", "end 0.25"],
  });

  if (reduceMotion) {
    return (
      <h2 id="industry-stage-heading" ref={ref} className={REVEAL_CLASS}>
        {text}
      </h2>
    );
  }

  return (
    <h2 id="industry-stage-heading" ref={ref} className={REVEAL_CLASS}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <RevealWord progress={scrollYProgress} index={index} total={words.length}>
            {word}
          </RevealWord>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h2>
  );
}

function RevealWord({
  progress,
  index,
  total,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  children: ReactNode;
}) {
  const start = (index / Math.max(total, 1)) * 0.72;
  const end = Math.min(1, start + 0.28);
  const color = useTransform(progress, [start, end], [REVEAL_FROM, REVEAL_TO]);

  return (
    <motion.span style={{ color }} className="inline-block">
      {children}
    </motion.span>
  );
}

/* ─── Conversation stage ─── */

function IndustryConversation({
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
      aria-hidden
      className="relative z-10 flex w-full max-w-[21rem] flex-col gap-2.5 sm:max-w-[22rem]"
    >
      <motion.div
        className="ms-auto max-w-[90%]"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.42,
          delay: reduceMotion ? 0 : 0.12,
          ease: EASE_OUT,
        }}
      >
        <p className="rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[13.5px] font-medium leading-snug text-white shadow-[0_18px_38px_-22px_rgba(12,10,9,0.65)]">
          {user}
        </p>
      </motion.div>

      {showReply ? (
        <motion.div
          className="max-w-[95%]"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE_OUT }}
        >
          <div className="rounded-2xl rounded-bl-md border border-white/70 bg-[#FCFBF8]/95 px-3.5 py-2.5 shadow-[0_22px_46px_-26px_rgba(35,31,24,0.55)] backdrop-blur-md">
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
  );
}
