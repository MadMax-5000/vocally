"use client";

import { useEffect, useState } from "react";

import { BrandImg, DashIn, MockCard, MockTitle, MockToggle, RAIL_COLOR } from "./shared";

function LightningIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6.7.4 2.2 6.6c-.18.24 0 .6.32.6h3.02L4.9 11.6c-.1.28.26.5.46.28l5.1-6.3c.18-.24 0-.6-.32-.6H7.12L7.16.68C7.18.4 6.82.22 6.7.4Z" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted" fill="none" aria-hidden>
      <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PROCEDURE = [
  "Greet customer, ask about return.",
  "Request order number or email.",
  null,
  "Confirm customer's return.",
  "Check return window eligibility.",
] as const;

export function BuildVisual() {
  const [actionsOn, setActionsOn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setActionsOn(true), 720);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-[540px] grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        <DashIn delay={0}>
          <MockCard>
            <MockTitle>Instructions</MockTitle>
            <p className="mt-2.5 text-[12px] leading-[1.55] text-muted">
              You are an AI agent helping customers with inquiries and requests.
              Represent the company by providing friendly, efficient service. Listen
              carefully,…
            </p>
          </MockCard>
        </DashIn>

        <DashIn delay={0.08}>
          <MockCard>
            <MockTitle>Branding</MockTitle>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-muted">Accent color</span>
              <span
                className="h-5 w-5 rounded-[4px]"
                style={{ backgroundColor: RAIL_COLOR }}
              />
            </div>
          </MockCard>
        </DashIn>

        <DashIn delay={0.16}>
          <MockCard>
            <MockTitle>Procedure</MockTitle>
            <ol className="mt-3 space-y-1.5">
              {PROCEDURE.map((line, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug text-body">
                  <span className="w-3 shrink-0 tabular-nums text-muted-soft">{i + 1}.</span>
                  {line === null ? (
                    <span className="flex flex-wrap items-center gap-1">
                      Use
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-medium text-[#2563eb]">
                        <LightningIcon />
                        lookup_order
                      </span>
                      for details.
                    </span>
                  ) : (
                    <span>{line}</span>
                  )}
                </li>
              ))}
            </ol>
          </MockCard>
        </DashIn>
      </div>

      <div className="flex flex-col gap-3">
        <DashIn delay={0.04}>
          <MockCard>
            <MockTitle>Model</MockTitle>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-hairline px-2.5 py-2">
              <span className="flex items-center gap-2 text-[12px] font-medium text-ink">
                <BrandImg src="/svg/claude.svg" className="h-4 w-4" />
                Claude Sonnet 4.6
              </span>
              <ChevronDown />
            </div>
          </MockCard>
        </DashIn>

        <DashIn delay={0.12}>
          <MockCard>
            <MockTitle>Guardrails</MockTitle>
            <p className="mt-2.5 text-[12px] leading-[1.55] text-muted">
              Avoid promising upcoming features or artist availability. Don&apos;t handle
              refunds; direct users to billing support or a human agent. Explain content
              availability varies by…
            </p>
          </MockCard>
        </DashIn>

        <DashIn delay={0.2}>
          <MockCard>
            <MockTitle>Actions</MockTitle>
            <ul className="mt-3 divide-y divide-hairline-soft">
              {[
                { name: "Get invoices", mark: <StripeMark />, on: true },
                { name: "Get slots", mark: <BrandImg src="/svg/cal.svg" />, on: false },
                {
                  name: "Retrieve products",
                  mark: <BrandImg src="/svg/shopify.svg" />,
                  on: false,
                },
              ].map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 text-[12px] font-medium text-ink">
                    {row.mark}
                    {row.name}
                  </span>
                  <MockToggle on={row.on && actionsOn} />
                </li>
              ))}
            </ul>
          </MockCard>
        </DashIn>
      </div>
    </div>
  );
}

function StripeMark() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#635BFF] text-[10px] font-bold text-white">
      S
    </span>
  );
}
