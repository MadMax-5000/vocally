import Image from "next/image";
import { CheckCircle, FlaskConical, Hand, Workflow } from "lucide-react";
import type { ElementType } from "react";

import { SuccessRateChart } from "@/components/marketing/SuccessRateChart";

const container = "mx-auto w-full max-w-[1200px] px-6";

const logos = [
  { key: "atlas",  label: "ATLAS·BANK" },
  { key: "ocp",   label: "OCP" },
  { key: "cars24", label: "CARS24" },
  { key: "maroc", label: "MAROC TELECOM" },
  { key: "inwi",  label: "inwi" },
];

type Feature = {
  key: string;
  icon: ElementType;
  label: string;
  body: string;
};

const features: Feature[] = [
  {
    key: "testing",
    icon: FlaskConical,
    label: "Testing",
    body: "Simulate real-world conversations to validate agents behave as expected before deployment.",
  },
  {
    key: "guardrails",
    icon: Hand,
    label: "Guardrails",
    body: "Establish clear behavioral and compliance rules that keep agent responses aligned with policy.",
  },
  {
    key: "workflows",
    icon: Workflow,
    label: "Workflows",
    body: "Handle complex conversation flows, apply business logic and connect securely to systems.",
  },
];

export function BentoShowcase() {
  return (
    <section className="border-t border-hairline bg-canvas py-section">
      <div className={container}>

        {/* ── Heading band ── */}
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
              Vocally Agents
            </div>
            <h2 className="mt-4 font-display text-display-lg tracking-tighter text-ink text-balance md:text-display-xl">
              Deploy agents that talk,<br className="hidden md:block" /> type, and take action
            </h2>
            <a
              href="/dashboard"
              className="mt-6 inline-flex h-9 items-center rounded-md bg-ink px-4 py-1.5 text-button text-on-primary transition-colors hover:bg-body-strong"
            >
              Learn more
            </a>
          </div>
          <p className="md:col-span-5 md:pt-14 max-w-[44ch] text-body-md leading-relaxed text-body text-pretty">
            Configure, deploy and monitor natural, human-sounding agents in 70+
            languages with leading accuracy and ultra-low latency across voice or
            chat.
          </p>
        </div>

        {/* ── Main bento: 2 equal columns ── */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">

          {/* Left card — grainy background + chat overlay */}
          <div className="flex flex-col overflow-hidden rounded-xxl border border-hairline bg-surface-card">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/images/background1.png"
                alt="Omnichannel agent conversation background"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/20" />

              <div className="absolute inset-0 flex flex-col justify-center gap-3 px-8 py-10">
                {/* User — right-aligned, glass */}
                <div className="flex justify-end">
                  <div className="max-w-[60%] rounded-[18px] rounded-tr-sm border border-white/30 bg-white/15 px-4 py-2 backdrop-blur-sm">
                    <p className="text-[14px] font-medium leading-snug text-white">
                      Can I get a refund?
                    </p>
                  </div>
                </div>

                {/* Bot — left-aligned, white card */}
                <div className="flex justify-start">
                  <div className="max-w-[65%] rounded-[18px] rounded-tl-sm bg-surface-card px-4 py-2.5 shadow-sm">
                    <p className="text-[14px] leading-snug text-ink">
                      Sure. Can you share your order number please?
                    </p>
                  </div>
                </div>

                {/* User — right-aligned, glass */}
                <div className="flex justify-end">
                  <div className="max-w-[60%] rounded-[18px] rounded-tr-sm border border-white/30 bg-white/15 px-4 py-2 backdrop-blur-sm">
                    <p className="text-[14px] font-medium leading-snug text-white">
                      It&rsquo;s EL4543490
                    </p>
                  </div>
                </div>

                {/* Bot — left-aligned, white card */}
                <div className="flex justify-start">
                  <div className="max-w-[65%] rounded-[18px] rounded-tl-sm bg-surface-card px-4 py-2.5 shadow-sm">
                    <p className="text-[14px] leading-snug text-ink">
                      Thank you. I have initiated the order refund process.
                    </p>
                  </div>
                </div>

                {/* Status pill */}
                <div className="flex justify-start">
                  <div className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-on-primary">
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="text-[14px] font-medium">Refund completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Caption strip */}
            <div className="px-6 py-5">
              <p className="text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
                Omnichannel agents
              </p>
              <p className="mt-1 text-body-sm text-body-strong leading-snug">
                Agents listen, read and interact just like humans would across
                phone, chat, email and WhatsApp.
              </p>
            </div>
          </div>

          {/* Right card — chart (no inline minHeight; chart owns its height) */}
          <div className="flex flex-col overflow-hidden rounded-xxl border border-hairline bg-surface-card">
            <div className="flex-1">
              <SuccessRateChart />
            </div>

            {/* Caption strip */}
            <div className="border-t border-hairline px-6 py-5">
              <p className="text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
                Analytics
              </p>
              <p className="mt-1 text-body-sm text-body-strong leading-snug">
                Easily measure success rates and CX metrics, optimizing flows over
                time.
              </p>
            </div>
          </div>
        </div>

        {/* ── Features bento: 3 equal columns ── */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {features.map(({ key, icon: Icon, label, body }) => (
            <div
              key={key}
              className="flex flex-col rounded-xxl border border-hairline bg-surface-card p-6"
            >
              {/* Icon plate */}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-card">
                <Icon className="h-4 w-4 text-ink" aria-hidden="true" />
              </div>

              {/* Eyebrow */}
              <p className="mt-10 text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
                {label}
              </p>

              {/* Body copy */}
              <p className="mt-2 max-w-[36ch] text-body-sm text-body-strong leading-snug">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Logos + CTA row ── */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xxl border border-hairline bg-surface-card px-6 py-5">
          <div className="flex flex-wrap items-center gap-6 md:gap-10">
            {logos.map((logo) => (
              <span
                key={logo.key}
                className="select-none text-[13px] font-semibold tracking-wide text-muted-soft"
              >
                {logo.label}
              </span>
            ))}
          </div>
          <a href="/dashboard" className="btn-outline shrink-0">
            Get started
          </a>
        </div>

      </div>
    </section>
  );
}
