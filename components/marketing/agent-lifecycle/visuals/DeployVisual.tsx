"use client";

import { useEffect, useState, type ReactNode } from "react";

import { BrandImg, DashIn, MockCard, MockToggle } from "./shared";

function WidgetMark() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="white" aria-hidden>
        <path d="M3.25 3.2h9.5c.7 0 1.25.52 1.25 1.15v5.1c0 .63-.55 1.15-1.25 1.15H8.1L5.2 13.4V10.6H3.25C2.55 10.6 2 10.08 2 9.45v-5.1c0-.63.55-1.15 1.25-1.15Z" />
      </svg>
    </span>
  );
}

function IframeMark() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7c3aed] font-mono text-[9px] font-bold tracking-tight text-white">
      {"</>"}
    </span>
  );
}

const CHANNELS: {
  name: string;
  mark: ReactNode;
  on: boolean;
}[] = [
  { name: "WordPress", mark: <BrandImg src="/svg/wordpress.svg" className="h-6 w-6" />, on: true },
  { name: "Website widget", mark: <WidgetMark />, on: true },
  { name: "Website iframe", mark: <IframeMark />, on: false },
  { name: "Shopify", mark: <BrandImg src="/svg/shopify.svg" className="h-6 w-6" />, on: true },
  { name: "Email", mark: <BrandImg src="/svg/gmail.svg" className="h-6 w-6" />, on: false },
  { name: "Slack", mark: <BrandImg src="/svg/slack.svg" className="h-6 w-6" />, on: false },
  { name: "WhatsApp", mark: <BrandImg src="/svg/whatsapp-icon.svg" className="h-6 w-6" />, on: true },
  { name: "Messenger", mark: <BrandImg src="/svg/messenger.svg" className="h-6 w-6" />, on: true },
  { name: "Instagram", mark: <BrandImg src="/svg/instagram-icon.svg" className="h-6 w-6" />, on: true },
];

export function DeployVisual() {
  const [togglesLive, setTogglesLive] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTogglesLive(true), 480);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <DashIn delay={0.06} className="mx-auto w-full max-w-[320px]">
      <MockCard className="px-3 py-2">
        <ul>
          {CHANNELS.map((row, i) => (
            <DashIn key={row.name} delay={0.1 + i * 0.055}>
              <li className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-3 text-[13px] font-medium text-ink">
                  {row.mark}
                  {row.name}
                </span>
                <MockToggle on={row.on && togglesLive} />
              </li>
            </DashIn>
          ))}
        </ul>
      </MockCard>
    </DashIn>
  );
}
