"use client";

import { ChevronDown } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const ICON = {
  gmail: "/svg/gmail.svg",
  whatsapp: "/svg/whatsapp-icon.svg",
  sms: "/svg/send.svg",
  messenger: "/svg/messenger.svg",
  instagram: "/svg/instagram-icon.svg",
  wordpress: "/svg/wordpress.svg",
  api: "/svg/api.svg",
  phone: "/svg/call.svg",
  shopify: "/svg/shopify.svg",
} as const;

// per-image rest scale, keyed by img index (1-9). default 1, drop below to shrink.
const SCALE: Partial<Record<number, number>> = {
  1: 0.92,
  2: 0.88,
  3: 0.9,
  4: 0.86,
  5: 0.88,
  6: 0.9,
  7: 0.9,
  8: 0.86,
  9: 0.88,
};
const s = (i: number) => SCALE[i] ?? 1;

// array order = stack order, back (z 2) -> front (z 10)
const CARDS: StackSpreadCard[] = [
  {
    item: { src: ICON.instagram, alt: "Instagram" },
    stackOffset: { x: -8, y: -10 },
    stackRotate: -18,
    target: { x: -18, y: -24, rotate: 0, scale: s(8), w: 11, h: 13 },
    targetSm: { x: -16, y: -28 },
    z: 2,
  },
  {
    item: { src: ICON.wordpress, alt: "WordPress" },
    stackOffset: { x: 14, y: -10 },
    stackRotate: 20,
    target: { x: 18, y: -24, rotate: 0, scale: s(7), w: 11, h: 14 },
    targetSm: { x: 16, y: -28 },
    z: 3,
  },
  {
    item: { src: ICON.gmail, alt: "Gmail" },
    stackOffset: { x: -16, y: 0 },
    stackRotate: -4,
    target: { x: -26, y: 0, rotate: 0, scale: s(6), w: 11, h: 13 },
    targetSm: { x: -16, y: -12 },
    z: 4,
  },
  {
    item: { src: ICON.whatsapp, alt: "WhatsApp" },
    stackOffset: { x: 1, y: -10 },
    stackRotate: -2,
    target: { x: 0, y: -26, rotate: 0, scale: s(5), w: 12, h: 14 },
    targetSm: { x: 16, y: -12 },
    z: 5,
  },
  {
    item: { src: ICON.shopify, alt: "Shopify" },
    stackOffset: { x: 10, y: -4 },
    stackRotate: 12,
    target: { x: 24, y: -10, rotate: 0, scale: s(9), w: 11, h: 13 },
    targetSm: { x: -16, y: 4 },
    z: 6,
  },
  {
    item: { src: ICON.messenger, alt: "Messenger" },
    stackOffset: { x: 18, y: 1 },
    stackRotate: 6,
    target: { x: 26, y: 8, rotate: 0, scale: s(4), w: 11, h: 13 },
    targetSm: { x: 16, y: 4 },
    z: 7,
  },
  {
    item: { src: ICON.sms, alt: "SMS" },
    stackOffset: { x: -6, y: 10 },
    stackRotate: 6,
    target: { x: -18, y: 24, rotate: 0, scale: s(3), w: 12, h: 14 },
    targetSm: { x: -16, y: 16 },
    z: 8,
  },
  {
    item: { src: ICON.api, alt: "API" },
    stackOffset: { x: 8, y: 7 },
    stackRotate: 3,
    target: { x: 0, y: 26, rotate: 0, scale: s(2), w: 12, h: 14 },
    targetSm: { x: 16, y: 16 },
    z: 9,
  },
  {
    item: { src: ICON.phone, alt: "Phone" },
    stackOffset: { x: 20, y: 12 },
    stackRotate: -7,
    target: { x: 18, y: 24, rotate: 0, scale: s(1), w: 11, h: 13 },
    targetSm: { x: -16, y: 28 },
    z: 10,
  },
];

const SCATTER_START = 0.12;
const SCATTER_END = 0.9;

const PARALLAX_X = 1.2;
const PARALLAX_Y = 1.0;
const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 };
const parallaxDepth = (i: number, total: number) =>
  total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75;

const SURFACE_CARD = "#ffffff";
const INK = "#0c0a09";

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number; h: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 16,
    card: { w: 26, h: 16 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setR(mq.matches ? RESPONSIVE.small : RESPONSIVE.desktop);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, PARALLAX_SPRING);
  const y = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled) return;

    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

export interface StackSpreadItem {
  src: string;
  alt?: string;
}

export interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  w: number;
  h: number;
}

export interface StackSpreadCard {
  item: StackSpreadItem;
  target: StackSpreadTarget;
  /** final x/y (vw/vh) for tablet + mobile; falls back to `target` */
  targetSm?: { x: number; y: number };
  /** angle while clustered */
  stackRotate?: number;
  /** offset while clustered (vw/vh) */
  stackOffset?: { x: number; y: number };
  /** paint order, higher on top */
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  clusterRotation,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  depth,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  clusterRotation: boolean;
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number; h: number } | null;
  stackScale: number;
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
}) {
  const { item, target } = card;

  const flat = reduce === true;
  const stackRotate = flat ? 0 : clusterRotation ? card.stackRotate ?? 0 : 0;
  const stackOffset = card.stackOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm
    ? colX != null
      ? Math.sign(sm.x) * colX
      : sm.x
    : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      const tx = stackOffset.x + (endX - stackOffset.x) * p;
      const ty = stackOffset.y + (endY - stackOffset.y) * p;
      const drift = depth * p;
      const dx = tx - px * PARALLAX_X * drift;
      const dy = ty - py * PARALLAX_Y * drift;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    },
  );
  const rotate = useTransform(progress, [0, 1], [stackRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.h : target.h}vh`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
    >
      <CardFace item={item} cardRadius={cardRadius} />
    </motion.div>
  );
}

function CardFace({
  item,
  cardRadius,
}: {
  item: StackSpreadItem;
  cardRadius: number;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden border border-hairline-strong bg-surface-card shadow-[0_8px_28px_rgba(12,10,9,0.07)] max-md:rounded-[4vw]"
      style={{ borderRadius: `${cardRadius}px` }}
    >
      <img
        src={item.src}
        alt={item.alt ?? ""}
        draggable={false}
        className="h-[32%] w-[32%] object-contain"
      />
    </div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  title: string;
  titleMuted?: string;
  titleEnd?: string;
  subtitle: string;
  scrollHint?: string;
  scrollLength?: number;
  bgColor?: string;
  clusterRotation?: boolean;
  stackScale?: number;
  cardRadius?: number;
  textColor?: string;
  textFadeStart?: number;
  showScrollHint?: boolean;
}

function StackSpreadStage({
  cards,
  title,
  titleMuted,
  titleEnd,
  subtitle,
  scrollHint,
  scrollLength = 350,
  bgColor = SURFACE_CARD,
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = INK,
  textFadeStart = 0.12,
  showScrollHint = true,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } =
    useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const progress = useTransform(
    scrollYProgress,
    [0, SCATTER_START, SCATTER_END, 1],
    [0, 0, 1, 1],
  );

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });
  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;
  const copyOpacity = useTransform(
    progress,
    [textFadeStart, textFadeStart + 0.22],
    [0, 1],
  );
  const copyScale = useTransform(
    progress,
    [textFadeStart, textFadeStart + 0.4],
    [0.85, 1],
  );

  const hintOpacity = useTransform(progress, [0, SCATTER_START], [1, 0]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full"
      style={{ height: `${scrollLength}vh`, backgroundColor: bgColor }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 z-[15] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            opacity: copyOpacity,
            scale: noScale ? 1 : copyScale,
          }}
        >
          <h2
            className="w-full max-w-[18ch] font-display text-[4.4vw] font-extrabold !leading-[1.08] tracking-tight max-md:text-[11vw]"
            style={{ color: textColor }}
          >
            {title}
            {titleMuted || titleEnd ? (
              <>
                <br />
                {titleMuted ? (
                  <span className="opacity-60">{titleMuted} </span>
                ) : null}
                {titleEnd}
              </>
            ) : null}
          </h2>
          <p
            className="mt-[1.2vw] w-full max-w-[42ch] font-body text-[1.15vw] leading-relaxed tracking-tight max-md:mt-3 max-md:text-[3.6vw]"
            style={{ color: textColor, opacity: 0.6 }}
          >
            {subtitle}
          </p>
        </motion.div>

        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              clusterRotation={clusterRotation}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              depth={parallaxEnabled ? parallaxDepth(i, cards.length) : 0}
            />
          ))}
        </div>

        {showScrollHint && scrollHint ? (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[3vh] z-20 flex flex-col items-center gap-[0.6vh] text-[0.8vw] font-medium uppercase tracking-[0.2em] max-md:bottom-6 max-md:gap-1 max-md:text-[2.8vw]"
            style={{ color: textColor, opacity: hintOpacity }}
          >
            <span>{scrollHint}</span>
            <ChevronDown
              className="h-4 w-4 animate-bounce max-md:h-[4vw] max-md:w-[4vw]"
              aria-hidden="true"
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

export interface StackSpreadProps {
  title: string;
  titleMuted?: string;
  titleEnd?: string;
  subtitle: string;
  scrollHint?: string;
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** color of the centre headline and subtitle */
  textColor?: string;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
  /** show the "scroll to spread" hint at the bottom until the scatter begins */
  showScrollHint?: boolean;
}

export default function StackSpread({
  title,
  titleMuted,
  titleEnd,
  subtitle,
  scrollHint,
  scrollLength = 350,
  bgColor = SURFACE_CARD,
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = INK,
  textFadeStart = 0.12,
  showScrollHint = true,
}: StackSpreadProps) {
  return (
    <StackSpreadStage
      cards={CARDS}
      title={title}
      titleMuted={titleMuted}
      titleEnd={titleEnd}
      subtitle={subtitle}
      scrollHint={scrollHint}
      scrollLength={scrollLength}
      bgColor={bgColor}
      clusterRotation={clusterRotation}
      stackScale={stackScale}
      cardRadius={cardRadius}
      textColor={textColor}
      textFadeStart={textFadeStart}
      showScrollHint={showScrollHint}
    />
  );
}
