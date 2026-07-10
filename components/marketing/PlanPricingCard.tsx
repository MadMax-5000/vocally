import type { ReactNode } from "react";

import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon } from "@/lib/icons/app-icons";
import type { PlanFeature } from "@/lib/billing/plan-features";

type PlanPricingCardProps = {
  name: string;
  description: string;
  showPrice: string | null;
  isFree: boolean;
  isPro: boolean;
  isCurrentPlan: boolean;
  recommendedLabel?: string;
  currentPlanBadgeLabel?: string;
  perMonthLabel?: string;
  features: PlanFeature[];
  overageText?: string | null;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
};

export function PlanPricingCard({
  name,
  description,
  showPrice,
  isFree,
  isPro,
  isCurrentPlan,
  recommendedLabel,
  currentPlanBadgeLabel,
  perMonthLabel,
  features,
  overageText,
  children,
  headingLevel = "h2",
}: PlanPricingCardProps) {
  const Heading = headingLevel;

  return (
    <article
      className={`flex flex-col rounded-xxl border p-8 ${
        isPro
          ? "border-2 border-white/20 bg-primary"
          : isCurrentPlan
            ? "border-2 border-primary/30 bg-surface-card ring-1 ring-primary/20"
            : "border-hairline bg-surface-card"
      }`}
    >
      {(isPro || isCurrentPlan) && (recommendedLabel || currentPlanBadgeLabel) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {isPro && recommendedLabel && (
            <span className="inline-flex self-start items-center rounded-full bg-white/90 px-3 py-[2px] text-xs font-semibold text-primary ring-1 ring-inset ring-white/20">
              {recommendedLabel}
            </span>
          )}
          {isCurrentPlan && currentPlanBadgeLabel && (
            <span
              className={`inline-flex self-start items-center rounded-full px-3 py-[2px] text-xs font-semibold ${
                isPro
                  ? "bg-white/90 text-primary ring-1 ring-inset ring-white/20"
                  : "border border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {currentPlanBadgeLabel}
            </span>
          )}
        </div>
      )}

      <Heading
        className={`font-display text-display-sm tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}
      >
        {name}
      </Heading>
      <p className={`mt-2 text-body-sm leading-relaxed ${isPro ? "text-on-primary/80" : "text-body"}`}>
        {description}
      </p>

      <p
        className={`mt-6 font-display text-display-md tracking-tighter ${isPro ? "text-on-primary" : "text-ink"}`}
      >
        {showPrice}
      </p>
      {!isFree && perMonthLabel && (
        <p className={`mt-1 text-caption ${isPro ? "text-on-primary/70" : "text-muted"}`}>{perMonthLabel}</p>
      )}

      <div className="mt-8 flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  isPro
                    ? feature.included
                      ? "bg-white/20 text-on-primary"
                      : "bg-white/10 text-on-primary/40"
                    : feature.included
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-strong text-muted-soft"
                }`}
              >
                <AppIcon icon={CheckIcon} className="h-3 w-3" aria-hidden="true" />
              </span>
              <span
                className={`text-body-sm leading-snug ${
                  isPro
                    ? feature.included
                      ? "text-on-primary/90"
                      : "text-on-primary/50"
                    : feature.included
                      ? "text-body"
                      : "text-muted-soft"
                }`}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {overageText && (
          <p
            className={`mt-4 text-caption leading-relaxed ${isPro ? "text-on-primary/60" : "text-muted-soft"}`}
          >
            {overageText}
          </p>
        )}
      </div>

      {children}
    </article>
  );
}
