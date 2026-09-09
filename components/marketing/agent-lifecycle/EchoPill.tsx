"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";

import { EASE_OUT } from "./visuals/shared";

export type EchoFan = "end" | "start" | "spread" | "spread-start";

type Layer = { x: number; opacity: number };

const FAN_LAYERS: Record<EchoFan, Layer[]> = {
  end: [
    { x: 16, opacity: 0.5 },
    { x: 30, opacity: 0.32 },
    { x: 44, opacity: 0.16 },
  ],
  start: [
    { x: -16, opacity: 0.5 },
    { x: -30, opacity: 0.32 },
    { x: -44, opacity: 0.16 },
  ],
  spread: [
    { x: -18, opacity: 0.38 },
    { x: 16, opacity: 0.42 },
    { x: 32, opacity: 0.22 },
  ],
  "spread-start": [
    { x: -32, opacity: 0.22 },
    { x: -16, opacity: 0.42 },
    { x: 18, opacity: 0.38 },
  ],
};

type EchoPillProps = {
  label: string;
  color: string;
  echo: string;
  fan: EchoFan;
  open: boolean;
};

export function EchoPill({ label, color, echo, fan, open }: EchoPillProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const locale = useLocale();
  const sign = locale === "ar" ? -1 : 1;
  const layers = FAN_LAYERS[fan];
  const shown = reduceMotion ? true : open;
  const room =
    fan === "end" ? "pe-12" : fan === "start" ? "ps-12" : "px-10";

  return (
    <span className={`relative inline-flex ${room}`}>
      <span className="relative inline-flex isolate">
        {layers.map((layer, index) => (
          <motion.span
            key={index}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ backgroundColor: echo, zIndex: index }}
            initial={false}
            animate={{
              x: shown ? layer.x * sign : 0,
              opacity: shown ? layer.opacity : 0,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.55, delay: index * 0.06, ease: EASE_OUT }
            }
          />
        ))}
        <span
          className="relative z-10 inline-flex items-center rounded-full px-4 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white sm:px-5 sm:py-1.5 sm:text-[13px]"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}
