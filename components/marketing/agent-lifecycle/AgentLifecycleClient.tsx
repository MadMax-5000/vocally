"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { BookDemoLink } from "@/components/marketing/BookDemoLink";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { EchoPill, type EchoFan } from "./EchoPill";

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
  number: string;
  label: string;
  body: string;
};

type StepTheme = {
  card: string;
  stage: string;
  headline: string;
  pill: string;
  echo: string;
  body: string;
  fan: EchoFan;
};

const THEMES: Record<LifecycleStepKey, StepTheme> = {
  build: {
    card: "#CDE8FF",
    stage: "#E3F3FF",
    headline: "#1E4FBF",
    pill: "#2F6BFF",
    echo: "#A8D4FF",
    body: "#3D4A66",
    fan: "end",
  },
  test: {
    card: "#FFD8C8",
    stage: "#FFE8DC",
    headline: "#8B3A1A",
    pill: "#C45C26",
    echo: "#FFC4A8",
    body: "#5C4A42",
    fan: "spread",
  },
  deploy: {
    card: "#F0F7A8",
    stage: "#F7FBC8",
    headline: "#3D5A1F",
    pill: "#6B8F2A",
    echo: "#DCE878",
    body: "#4A5540",
    fan: "spread-start",
  },
  optimize: {
    card: "#FFD0EE",
    stage: "#FFE4F6",
    headline: "#9B1D5A",
    pill: "#C2186A",
    echo: "#FFB3E3",
    body: "#5C3D4A",
    fan: "start",
  },
};

const STICKY_TOP = "5rem";
const STACK_PEEK = 12;

type Props = {
  title: string;
  cta: string;
  createAgentCta: string;
  steps: LifecycleStep[];
};

function StepVisual({ id }: { id: LifecycleStepKey }) {
  if (id === "build") return <BuildVisual />;
  if (id === "test") return <TestVisual />;
  if (id === "deploy") return <DeployVisual />;
  return <OptimizeVisual />;
}

export function AgentLifecycleClient({ title, cta, createAgentCta, steps }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const sticky = !reduceMotion;
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [opened, setOpened] = useState<Record<string, boolean>>(() =>
    reduceMotion ? Object.fromEntries(steps.map((step) => [step.id, true])) : {}
  );

  useEffect(() => {
    if (reduceMotion) {
      setOpened(Object.fromEntries(steps.map((step) => [step.id, true])));
      return;
    }

    const nodes = itemRefs.current.filter((node): node is HTMLLIElement => node !== null);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = (entry.target as HTMLElement).dataset.step;
          if (!id) return;
          setOpened((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
        });
      },
      { threshold: 0.4, rootMargin: "-8% 0px -12% 0px" }
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [reduceMotion, steps]);

  return (
    <section id="lifecycle" className="bg-surface-card">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-section">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[2.5rem] leading-[1.1] tracking-[-0.025em] text-ink md:text-[3.25rem]">
            {title}
          </h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <BookDemoLink className="btn-primary w-full justify-center sm:w-auto">
              {cta}
            </BookDemoLink>
            <Link className="btn-outline w-full justify-center sm:w-auto" href="/sign-up">
              {createAgentCta}
            </Link>
          </div>
        </div>

        <ol className="lifecycle-cards mt-10 flex list-none flex-col gap-6">
          {steps.map((step, index) => {
            const theme = THEMES[step.id];
            return (
              <li
                key={step.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-step={step.id}
                className={cn("max-md:static motion-reduce:static", sticky && "md:sticky")}
                style={{
                  zIndex: index + 1,
                  ...(sticky
                    ? { top: `calc(${STICKY_TOP} + ${index * STACK_PEEK}px)` }
                    : undefined),
                }}
              >
                <article
                  className="grid min-h-[28rem] overflow-hidden rounded-xxl shadow-[0_8px_32px_rgba(12,10,9,0.08)] lg:grid-cols-2 lg:min-h-[38rem]"
                  style={{ backgroundColor: theme.card }}
                >
                  <div className="flex flex-col items-start justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                    <EchoPill
                      label={step.label}
                      color={theme.pill}
                      echo={theme.echo}
                      fan={theme.fan}
                      open={Boolean(opened[step.id])}
                    />
                    <h3
                      className="mt-6 font-display text-display-lg tracking-tighter text-balance md:text-display-mega"
                      style={{ color: theme.headline }}
                    >
                      {step.label}
                    </h3>
                    <p
                      className="mt-4 max-w-[42ch] text-body-md leading-relaxed"
                      style={{ color: theme.body }}
                    >
                      {step.body}
                    </p>
                  </div>

                  <div className="p-3 pt-0 sm:p-4 sm:pt-0 lg:flex lg:flex-col lg:p-5 lg:ps-0 lg:py-5">
                    <div
                      className="relative min-h-[280px] overflow-hidden rounded-xxl sm:min-h-[340px] lg:min-h-0 lg:flex-1"
                      style={{ backgroundColor: theme.stage }}
                    >
                      <div
                        className="relative z-10 flex h-full min-h-[280px] items-center justify-center p-5 sm:min-h-[340px] sm:p-8 lg:min-h-full lg:p-10"
                        aria-hidden
                      >
                        <div className="pointer-events-none flex w-full justify-center select-none">
                          <StepVisual id={step.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
