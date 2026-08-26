"use client";

import { useEffect, useState } from "react";

import { BrandImg, DashIn, MockCard } from "@/components/marketing/agent-lifecycle/visuals/shared";

const THREAD = [
  { from: "customer" as const, text: "Where is my order?" },
  { from: "agent" as const, text: "I can check that. What's your order number?" },
  { from: "customer" as const, text: "EL4543490" },
] as const;

function AnselioMark() {
  return (
    // Decorative mock chrome
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo-primary-color.png"
      alt=""
      className="h-8 w-8 rounded-full object-cover"
      aria-hidden
    />
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink" fill="none" aria-hidden>
      <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4.4 2.8h2.2l.9 2.2-1.2 1.1a8.2 8.2 0 0 0 3.6 3.6l1.1-1.2 2.2.9v2.2c0 .6-.5 1.1-1.1 1.1C6.8 12.7 3.3 9.2 3.3 3.9c0-.6.5-1.1 1.1-1.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="2.2" y="4.2" width="8.2" height="7.6" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.4 7.1 13.8 5.2v5.6L10.4 8.9V7.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleMark() {
  return (
    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink">
      <svg viewBox="0 0 12 12" className="h-3 w-3 text-on-primary" fill="currentColor" aria-hidden>
        <path d="M6 0.6 6.9 4.4 10.8 5.2 6.9 6.1 6 10 5.1 6.1 1.2 5.2 5.1 4.4Z" />
      </svg>
    </span>
  );
}

function SmsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-muted" fill="none" aria-hidden>
      <rect x="2.4" y="3.2" width="15.2" height="10.4" rx="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.8 13.6 4.6 17.2 10 13.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.4 8.4h7.2M6.4 10.6h4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-muted" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h14M10 3c2.2 2.2 3.3 4.5 3.3 7S12.2 14.8 10 17C7.8 14.8 6.7 12.5 6.7 10S7.8 5.2 10 3Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-soft"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export function ChatVisual() {
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowReply(true), 1100);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
      <DashIn delay={0.04} className="w-full">
        <MockCard className="flex min-h-[420px] flex-col p-0">
          <div className="flex items-center gap-2.5 border-b border-hairline px-3.5 py-3.5">
            <span className="rtl:rotate-180">
              <BackIcon />
            </span>
            <AnselioMark />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-none text-ink">Anselio</p>
              <p className="mt-1 text-[12px] leading-none text-muted">Website</p>
            </div>
            <span className="flex items-center gap-3 text-muted">
              <PhoneIcon />
              <VideoIcon />
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3 px-4 py-4">
            {THREAD.map((msg, i) => (
              <DashIn key={msg.text} delay={0.1 + i * 0.12}>
                <div className={msg.from === "customer" ? "flex justify-end" : "flex items-start gap-2"}>
                  {msg.from === "agent" ? <SparkleMark /> : null}
                  <p
                    className={[
                      "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.45]",
                      msg.from === "customer"
                        ? "bg-primary text-on-primary"
                        : "bg-surface-strong text-body",
                    ].join(" ")}
                  >
                    {msg.text}
                  </p>
                </div>
              </DashIn>
            ))}

            <DashIn delay={0.48}>
              <div className="flex items-start gap-2">
                <SparkleMark />
                {showReply ? (
                  <p className="max-w-[82%] rounded-2xl bg-surface-strong px-3.5 py-2.5 text-[13.5px] leading-[1.45] text-body">
                    Shipped this morning. Tracking is on the way.
                  </p>
                ) : (
                  <p className="rounded-2xl bg-surface-strong px-3.5 py-2.5">
                    <TypingDots />
                  </p>
                )}
              </div>
            </DashIn>
          </div>
        </MockCard>
      </DashIn>

      <DashIn delay={0.42} className="mt-3">
        <div className="flex items-center gap-3.5 rounded-full bg-surface-card px-5 py-2.5 shadow-[0_8px_28px_rgba(12,10,9,0.10)]">
          <BrandImg src="/svg/slack.svg" className="h-5 w-5 opacity-50 grayscale" />
          <BrandImg src="/svg/instagram-icon.svg" className="h-5 w-5 opacity-50 grayscale" />
          <BrandImg src="/svg/whatsapp-icon.svg" className="h-5 w-5 opacity-50 grayscale" />
          <BrandImg src="/svg/messenger.svg" className="h-5 w-5 opacity-50 grayscale" />
          <SmsIcon />
          <GlobeIcon />
        </div>
      </DashIn>
    </div>
  );
}
