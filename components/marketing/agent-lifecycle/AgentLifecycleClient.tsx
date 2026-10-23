"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";

import { FrostedPanel } from "@/components/marketing/FrostedPanel";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const BuildVisual = dynamic(() =>
  import("./visuals/BuildVisual").then((mod) => mod.BuildVisual)
);
const TestVisual = dynamic(() =>
  import("./visuals/TestVisual").then((mod) => mod.TestVisual)
);
const DeployVisual = dynamic(() =>
  import("./visuals/DeployVisual").then((mod) => mod.DeployVisual)
);
const OptimizeVisual = dynamic(() =>
  import("./visuals/OptimizeVisual").then((mod) => mod.OptimizeVisual)
);

export type LifecycleStepKey = "build" | "test" | "deploy" | "optimize";

export type LifecycleStep = {
  id: LifecycleStepKey;
  label: string;
  body: string;
};

const STICKY_TOP = "5rem";
const STACK_PEEK = 12;

/* One painting per step, centred. */
const BACKGROUNDS: Record<LifecycleStepKey, string> = {
  build: "/images/cards-background4.png",
  test: "/images/cards-background5.png",
  deploy: "/images/cards-background6.png",
  optimize: "/images/cards-background7.png",
};

const CROPS: Record<LifecycleStepKey, string> = {
  build: "object-center",
  test: "object-center",
  deploy: "object-center",
  optimize: "object-center",
};

/* Natural widths of the step visuals, so the glass frame hugs each one. */
const VISUAL_WIDTH: Record<LifecycleStepKey, number> = {
  build: 540,
  test: 440,
  deploy: 320,
  optimize: 520,
};

type Props = {
  eyebrow: string;
  title: string;
  titleMuted: string;
  cardCta: string;
  steps: LifecycleStep[];
};

function StepVisual({ id }: { id: LifecycleStepKey }) {
  if (id === "build") return <BuildVisual />;
  if (id === "test") return <TestVisual />;
  if (id === "deploy") return <DeployVisual />;
  return <OptimizeVisual />;
}

export function AgentLifecycleClient({
  eyebrow,
  title,
  titleMuted,
  cardCta,
  steps,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const sticky = !reduceMotion;

  return (
    <section id="features" className="bg-canvas-warm">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-section pt-[104px]">
        <div className="max-w-[760px]">
          <p className="flex items-center gap-2 text-[13px] font-medium leading-none text-warm-body">
            <span aria-hidden className="size-1 rounded-full bg-warm-body" />
            {eyebrow}
          </p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[52px]">
            <span className="block">{title}</span>
            <span className="block text-warm-body">{titleMuted}</span>
          </h2>
        </div>

        <ol className="mt-12 flex list-none flex-col gap-6">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={cn("max-md:static motion-reduce:static", sticky && "md:sticky")}
              style={{
                zIndex: index + 1,
                ...(sticky
                  ? { top: `calc(${STICKY_TOP} + ${index * STACK_PEEK}px)` }
                  : undefined),
              }}
            >
              <article className="mx-auto grid w-full max-w-[1200px] overflow-hidden rounded-[24px] bg-surface-warm p-3 lg:min-h-[34rem] lg:grid-cols-[1.02fr_1fr] lg:p-4">
                {/* Left — painted stage with the step visual in a glass frame */}
                <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[16px] p-3 sm:p-5 lg:h-full">
                  <Image
                    src={BACKGROUNDS[step.id]}
                    alt=""
                    aria-hidden
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className={cn("object-cover", CROPS[step.id])}
                  />
                  <div aria-hidden className="absolute inset-0 bg-white/10" />
                  <FrostedPanel className="relative w-fit max-w-full">
                    <div
                      style={{ width: VISUAL_WIDTH[step.id] }}
                      className="[zoom:0.42] sm:[zoom:0.72] lg:[zoom:0.78]"
                    >
                      <StepVisual id={step.id} />
                    </div>
                  </FrostedPanel>
                </div>

                {/* Right — step copy */}
                <div className="flex flex-col items-start justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
                  <h3 className="font-display text-[40px] leading-[43px] tracking-[-0.8px] text-black">
                    {step.label}
                  </h3>
                  <p className="mt-4 max-w-[34ch] text-[20px] font-normal leading-[30px] text-warm-body">
                    {step.body}
                  </p>
                  <Link
                    href="/sign-up"
                    className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-black px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-warm"
                  >
                    {cardCta}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
