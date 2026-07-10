import { PlanCtaButton } from "@/components/billing/PlanCtaButton";
import { AppIcon } from "@/components/ui/app-icon";
import { ArrowUpRightIcon, CheckIcon } from "@/lib/icons/app-icons";
import type { PlanCta, PlanCtaLabelKey } from "@/lib/billing/plan-cta";
import type { PlanFeature } from "@/lib/billing/plan-features";

type EnterprisePlanCardProps = {
  name: string;
  blurb: string;
  features: PlanFeature[];
  customPricingLabel: string;
  customPricingHint?: string;
  currentPlanBadgeLabel?: string;
  isCurrentPlan: boolean;
  cta: PlanCta;
  ctaLabels: Record<PlanCtaLabelKey, string>;
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function EnterprisePlanCard({
  name,
  blurb,
  features,
  customPricingLabel,
  customPricingHint,
  currentPlanBadgeLabel,
  isCurrentPlan,
  cta,
  ctaLabels,
  headingLevel = "h2",
  className,
}: EnterprisePlanCardProps) {
  const Heading = headingLevel;

  return (
    <article
      className={[
        "grid gap-8 rounded-xxl border border-hairline bg-surface-card p-8 md:grid-cols-[1fr_auto] md:items-start md:p-10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <Heading className="font-display text-display-sm tracking-tighter text-ink">{name}</Heading>
        <p className="mt-2 max-w-[52ch] text-body-sm leading-relaxed text-body">{blurb}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AppIcon icon={CheckIcon} className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="text-body-sm leading-snug text-body">{feature.text}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan && currentPlanBadgeLabel && (
          <span className="mt-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-[2px] text-xs font-semibold text-primary">
            {currentPlanBadgeLabel}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-surface-strong/40 p-6 md:min-w-[240px]">
        <div>
          <p className="font-display text-display-sm tracking-tighter text-ink">{customPricingLabel}</p>
          <p className="mt-1 text-caption leading-relaxed text-muted">{customPricingHint}</p>
        </div>

        <PlanCtaButton
          cta={cta}
          labels={ctaLabels}
          compact
          className="mt-auto w-full md:w-auto"
          trailing={
            cta.kind !== "disabled" ? (
              <AppIcon icon={ArrowUpRightIcon} className="h-4 w-4" aria-hidden="true" />
            ) : undefined
          }
        />
      </div>
    </article>
  );
}
