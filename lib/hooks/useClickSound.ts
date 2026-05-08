"use client";

import { useCallback, useRef } from "react";

const CLICK_SOUND_SRC = "/audio/click-sound.wav";

/**
 * Plays the onboarding click sound. Reuses one Audio instance and resets
 * `currentTime` so rapid taps still feel responsive.
 */
export function useClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      if (!audioRef.current) {
        audioRef.current = new Audio(CLICK_SOUND_SRC);
        audioRef.current.preload = "auto";
      }
      const a = audioRef.current;
      a.currentTime = 0;
      void a.play().catch(() => {
        // Autoplay policies may block until user gesture — ignore.
      });
    } catch {
      // Ignore audio failures
    }
  }, []);

  return play;
}
