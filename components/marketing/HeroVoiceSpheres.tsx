"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const BASE_SPHERES = [
  {
    id: "arabic",
    imageSrc: "/images/background1.png",
    title: "Arabic Support",
    description: "Natural Darija voice for your Moroccan customers.",
    audioSrc: "/audio/piano-c4.wav",
  },
  {
    id: "french",
    imageSrc: "/images/background2.png",
    title: "French Pro",
    description: "Smooth French voice for enterprise calls.",
    audioSrc: "/audio/piano-c4.wav",
  },
  {
    id: "english",
    imageSrc: "/images/background3.png",
    title: "English Agent",
    description: "Crisp English voice for international clients.",
    audioSrc: "/audio/piano-c4.wav",
  },
  {
    id: "multilingual",
    imageSrc: "/images/background4.png",
    title: "Multilingual",
    description: "Seamlessly switches language mid-conversation.",
    audioSrc: "/audio/piano-c4.wav",
  },
] as const;

// Duplicate array to ensure perfectly symmetric distances in the carousel loop
const SPHERES = [
  ...BASE_SPHERES.map((s) => ({ ...s, id: `${s.id}-1` })),
  ...BASE_SPHERES.map((s) => ({ ...s, id: `${s.id}-2` })),
];

const COUNT = SPHERES.length; // 8

interface SlotValues {
  x: number;
  scale: number;
  opacity: number;
  blurPx: number;
  zIndex: number;
  pointerEvents: "auto" | "none";
}

function slotValues(dist: number): SlotValues {
  const abs = Math.abs(dist);
  const sign = Math.sign(dist);

  if (abs === 0) return { x: 0,          scale: 1.0,  opacity: 1.0,  blurPx: 0,  zIndex: 10, pointerEvents: "auto" };
  if (abs === 1) return { x: sign * 248, scale: 0.70, opacity: 0.65, blurPx: 4,  zIndex: 5,  pointerEvents: "auto" };
  if (abs === 2) return { x: sign * 455, scale: 0.48, opacity: 0.18, blurPx: 9,  zIndex: 1,  pointerEvents: "auto" };
  return                { x: sign * 650, scale: 0.30, opacity: 0,    blurPx: 14, zIndex: 0,  pointerEvents: "none" };
}

export function HeroVoiceSpheres() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0); // Grows infinitely
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      stopAudio();
      setActiveIndex((prev) => prev + dir);
    },
    [stopAudio],
  );

  const goTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex === activeIndex) return;
      stopAudio();
      setActiveIndex(targetIndex);
    },
    [activeIndex, stopAudio],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  // Rebuild audio element each time the active sphere changes
  useEffect(() => {
    const realIndex = ((activeIndex % COUNT) + COUNT) % COUNT;
    const audio = new Audio(SPHERES[realIndex].audioSrc);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    return () => {
      audio.pause();
      audio.onended = null;
    };
  }, [activeIndex]);

  // Arrow-key navigation when the carousel has focus
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigate(1); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [navigate]);

  const spring = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({ type: "spring" as const, stiffness: 280, damping: 30, mass: 0.8 });

  return (
    <div className="mt-10 w-full">
      {/* ── Carousel track ── */}
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="AI voice personas"
        tabIndex={0}
        className="relative h-[300px] w-full overflow-visible rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2"
      >
        {SPHERES.map((sphere, i) => {
          const offset = activeIndex - i;
          const normalized = Math.round(offset / COUNT) * COUNT;
          const virtualIndex = i + normalized;
          const dist = virtualIndex - activeIndex;

          const { x, scale, opacity, blurPx, zIndex, pointerEvents } = slotValues(dist);
          const isCentered = dist === 0;

          return (
            <motion.div
              key={sphere.id}
              role="group"
              aria-roledescription="slide"
              aria-label={sphere.title}
              aria-hidden={!isCentered}
              initial={false}
              animate={{
                x,
                scale,
                opacity,
                filter: `blur(${shouldReduceMotion ? 0 : blurPx}px)`,
              }}
              transition={spring}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: -130,
                marginLeft: -130,
                zIndex,
                pointerEvents,
              }}
              onClick={() => !isCentered && goTo(virtualIndex)}
              className={!isCentered && opacity > 0 ? "cursor-pointer" : undefined}
            >
              <div className="relative h-[260px] w-[260px] select-none overflow-hidden rounded-full">
                <Image
                  src={sphere.imageSrc}
                  alt={sphere.title}
                  fill
                  sizes="260px"
                  className="object-cover"
                  draggable={false}
                  priority={i <= 1}
                />

                {/* Play / pause — only rendered on the centred orb */}
                {isCentered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      aria-label={isPlaying ? `Pause ${sphere.title}` : `Play ${sphere.title}`}
                      aria-pressed={isPlaying}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card/90 text-ink shadow-[0_2px_14px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
                    >
                      {isPlaying
                        ? <Pause  className="h-5 w-5 fill-current" />
                        : <Play   className="h-5 w-5 translate-x-[1px] fill-current" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Navigation row + animated caption ── */}
      <div className="mt-5 flex items-start justify-center gap-5">
        <button
          type="button"
          aria-label="Previous voice"
          onClick={() => navigate(-1)}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-strong hover:text-body-strong"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-[220px] text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8,  filter: shouldReduceMotion ? "blur(0px)" : "blur(4px)" }}
              animate={{ opacity: 1, y: 0,                            filter: "blur(0px)" }}
              exit={{    opacity: 0, y: shouldReduceMotion ? 0 : -8, filter: shouldReduceMotion ? "blur(0px)" : "blur(4px)" }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: "easeOut" }}
            >
              <p className="font-display text-title-sm text-ink">
                {SPHERES[((activeIndex % COUNT) + COUNT) % COUNT].title}
              </p>
              <p className="mx-auto mt-1 max-w-[200px] text-pretty text-body-sm text-muted">
                {SPHERES[((activeIndex % COUNT) + COUNT) % COUNT].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Next voice"
          onClick={() => navigate(1)}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-strong hover:text-body-strong"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
