"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon } from "@/lib/icons/app-icons";
import { cn } from "@/lib/utils";

export type PricingPlan = {
  key: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  customPrice?: boolean;
};

export type PricingLabels = {
  monthly: string;
  yearly: string;
  yearlyBadge: string;
  yearlyNote: string;
  popular: string;
  includes: string;
  perMonth: string;
  note: string;
};

export function PricingCards({
  plans,
  labels,
}: {
  plans: PricingPlan[];
  labels: PricingLabels;
}) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const yearly = billing === "yearly";

  return (
    <div>
      <div className="mt-9 flex justify-center">
        <div
          role="group"
          aria-label={`${labels.monthly} / ${labels.yearly}`}
          className="flex items-center gap-1 rounded-full bg-[#EEECE4] p-1"
        >
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-[7px] text-[13px] leading-none transition-colors",
              !yearly
                ? "bg-white text-ink shadow-[0_1px_2px_rgba(12,10,9,0.08)]"
                : "text-warm-body hover:text-ink",
            )}
          >
            {labels.monthly}
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setBilling("yearly")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-[7px] text-[13px] leading-none transition-colors",
              yearly
                ? "bg-white text-ink shadow-[0_1px_2px_rgba(12,10,9,0.08)]"
                : "text-warm-body hover:text-ink",
            )}
          >
            {labels.yearly}
            <span className="rounded-full bg-ink/10 px-1.5 py-[3px] text-[10px] leading-none text-ink/70">
              {labels.yearlyBadge}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.key}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-[20px] bg-surface-warm p-6 sm:p-7",
              plan.featured && "ring-1 ring-inset ring-black/[0.04]",
            )}
          >
            {plan.featured && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 end-0 w-[64%] [mask-image:linear-gradient(to_right,transparent_0%,black_42%)] rtl:[mask-image:linear-gradient(to_left,transparent_0%,black_42%)]"
              >
                <Image
                  src="/images/cards-background4.webp"
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 360px, (min-width: 768px) 34vw, 70vw"
                  className="object-cover object-[72%_45%]"
                />
                <div className="absolute inset-0 bg-surface-warm/25" />
              </div>
            )}

            <div className="relative flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-[20px] leading-[1.2] text-ink">{plan.name}</h3>
                {plan.featured && (
                  <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium leading-none text-white">
                    {labels.popular}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <bdi className="font-display text-[34px] leading-none tracking-[-1.4px] text-ink lg:text-[38px]">
                  {yearly ? plan.priceYearly : plan.priceMonthly}
                </bdi>
                {!plan.customPrice && (
                  <span className="text-[13px] leading-none text-warm-body">{labels.perMonth}</span>
                )}
              </div>

              <p className="mt-3 max-w-[34ch] font-body text-[15px] font-normal leading-[1.5] tracking-[0.14px] text-warm-body">
                {plan.description}
              </p>

              <p className="mt-7 font-body text-[13px] leading-none text-warm-body">
                {labels.includes}
              </p>
              <ul className="mt-4 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 font-body text-[14px] font-normal leading-[1.45] text-ink/85"
                  >
                    <AppIcon
                      icon={CheckIcon}
                      className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ink/55"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href={plan.ctaHref}
                  className={cn(
                    "flex h-11 w-full items-center justify-center rounded-[10px] font-body text-[14px] font-medium transition-colors",
                    plan.featured
                      ? "bg-ink text-white hover:bg-ink/90"
                      : "bg-white text-ink ring-1 ring-inset ring-hairline hover:bg-white/70",
                  )}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-[62ch] text-center font-body text-[12px] leading-[1.6] text-warm-body">
        {yearly ? labels.yearlyNote : labels.note}
      </p>
    </div>
  );
}
