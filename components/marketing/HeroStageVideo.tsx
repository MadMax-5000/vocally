"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/hero-data-sources.mp4";

export function HeroStageVideo() {
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldReduceMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Autoplay may be blocked; ignore — muted + playsInline usually works.
    });
  }, [shouldReduceMotion]);

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xxl"
      style={{ backgroundColor: "#1e3a8a" }}
    >
      {/* Diamond grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.18]"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, transparent, transparent 27px, rgba(255,255,255,0.55) 27px, rgba(255,255,255,0.55) 28px)",
            "repeating-linear-gradient(-45deg, transparent, transparent 27px, rgba(255,255,255,0.55) 27px, rgba(255,255,255,0.55) 28px)",
          ].join(", "),
        }}
      />

      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        muted
        loop
        playsInline
        autoPlay={!shouldReduceMotion}
        preload="metadata"
        aria-label="Product preview: data sources"
      />
    </div>
  );
}
