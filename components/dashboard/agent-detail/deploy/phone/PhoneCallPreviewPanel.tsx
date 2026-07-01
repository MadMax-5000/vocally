"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { Mic, MicOff, PhoneOff, Volume2 } from "@/lib/icons/app-icons"

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type PhoneCallPreviewPanelProps = {
  businessName: string;
};

function CallTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    function tick() {
      const diff = Date.now() - startedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="font-mono text-[15px] font-medium tracking-tight text-ink">
      {elapsed}
    </span>
  );
}

function WaveformBar({ active }: { active: boolean }) {
  const height = useRef(4 + Math.random() * 20);

  return (
    <span
      className={cn(
        "w-[3px] rounded-full transition-all duration-150",
        active ? "bg-primary" : "bg-hairline-strong",
      )}
      style={{
        height: `${height.current}px`,
        animation: active ? "waveform-pulse 0.4s ease-in-out infinite alternate" : undefined,
        animationDelay: `${Math.random() * 0.3}s`,
      }}
    />
  );
}

function AudioWaveform({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 24 }).map((_, i) => (
        <WaveformBar key={i} active={speaking} />
      ))}
    </div>
  );
}

export function PhoneCallPreviewPanel({ businessName }: PhoneCallPreviewPanelProps) {
  const [callState, setCallState] = useState<"connecting" | "speaking" | "listening">(
    "connecting",
  );
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCallState("speaking"), 1800),
      setTimeout(() => setCallState("listening"), 4200),
      setTimeout(() => setCallState("speaking"), 6400),
      setTimeout(() => setCallState("listening"), 8600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const callStarted = useRef(new Date());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-title-sm font-medium text-ink">Preview</h3>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-canvas-soft/80">
          <div
            className={cn(
              "flex h-full max-h-full w-auto flex-col overflow-hidden rounded-[32px] border border-hairline shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.10)]",
            )}
            style={{ aspectRatio: '9 / 16' }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between bg-ink px-6 pt-[52px] pb-3 text-white/80">
              <span className="text-[13px] font-medium tracking-tight">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="size-[14px]" viewBox="0 0 16 10" fill="currentColor">
                  <rect x="10" width="2" height="10" rx="1" />
                  <rect x="6" width="2" height="8" rx="1" />
                  <rect x="2" width="2" height="6" rx="1" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-gradient-to-b from-ink to-[#1c1917] px-6">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="flex size-[72px] items-center justify-center rounded-full bg-primary/20 ring-[3px] ring-primary/40">
                  <div
                    className={cn(
                      "size-[60px] rounded-full bg-primary/30",
                      callState === "speaking" && "animate-pulse",
                    )}
                  />
                </div>
                {(callState === "speaking" || callState === "listening") && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-[1px] text-[10px] font-semibold text-white">
                    LIVE
                  </div>
                )}
              </div>

              {/* Agent name */}
              <h2 className="text-center text-[18px] font-medium text-white">
                {businessName}
              </h2>
              <p className="mt-1 text-[13px] text-white/60">
                {callState === "connecting"
                  ? "Connecting…"
                  : callState === "speaking"
                    ? "Speaking"
                    : "Listening"}
              </p>

              {/* Timer */}
              {(callState === "speaking" || callState === "listening") && (
                <div className="mt-2">
                  <CallTimer startedAt={callStarted.current} />
                </div>
              )}

              {/* Audio waveform */}
              <div className="mt-8 flex items-center justify-center">
                {callState === "connecting" ? (
                  <div className="flex items-center gap-2">
                    <div className="size-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                    <div className="size-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                    <div className="size-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <AudioWaveform speaking={callState === "speaking"} />
                )}
              </div>

              {/* Status hint */}
              <div className="mt-auto mb-8">
                {callState === "speaking" && (
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                    <AppIcon icon={Volume2} className="size-3.5 text-primary" />
                    <span className="text-[12px] text-white/70">
                      AI is speaking…
                    </span>
                  </div>
                )}
                {callState === "listening" && (
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                    <AppIcon icon={Mic} className="size-3.5 text-emerald-400" />
                    <span className="text-[12px] text-white/70">
                      Listening for your response…
                    </span>
                  </div>
                )}
                {callState === "connecting" && (
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                    <span className="text-[12px] text-white/50">
                      Establishing secure connection
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Call controls */}
            <div className="flex items-center justify-center gap-8 bg-ink pb-8 pt-3">
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="flex size-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <AppIcon icon={MicOff} className="size-5 text-red-400" />
                ) : (
                  <AppIcon icon={Mic} size={20} className="size-5 text-white/80" />
                )}
              </button>
              <button
                type="button"
                className="flex size-14 items-center justify-center rounded-full bg-red-500 shadow-lg transition-colors hover:bg-red-600"
                aria-label="End call"
              >
                <AppIcon icon={PhoneOff} className="size-6 text-white" />
              </button>
              <div className="size-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
