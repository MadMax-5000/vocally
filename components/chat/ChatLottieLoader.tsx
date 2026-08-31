"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const DotLottieReact = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false },
);

type ChatLottieLoaderProps = {
  className?: string;
};

export function ChatLottieLoader({ className }: ChatLottieLoaderProps) {
  return (
    <div
      className={cn("flex items-center py-0.5", className)}
      aria-label="Assistant is thinking"
      role="status"
    >
      <DotLottieReact
        src="/svg/loading.lottie"
        loop
        autoplay
        style={{ width: 40, height: 40 }}
      />
    </div>
  );
}
