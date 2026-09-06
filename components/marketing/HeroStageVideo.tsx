"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/hero-data-sources.mp4";
const POSTER_SRC = "/images/hero-data-sources-poster.webp";

export function HeroStageVideo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const host = hostRef.current;
    if (!host || reduceMotion) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSrc(VIDEO_SRC);
        io.disconnect();
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    void video.play().catch(() => {
      // Autoplay may be blocked; ignore — muted + playsInline usually works.
    });
  }, [src]);

  return (
    <div
      ref={hostRef}
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
        src={src}
        poster={POSTER_SRC}
        muted
        loop
        playsInline
        preload="none"
        aria-label="Product preview: data sources"
      />
    </div>
  );
}
