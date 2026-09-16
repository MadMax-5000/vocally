import { PlanCtaButton } from "@/components/billing/PlanCtaButton";
import { AppIcon } from "@/components/ui/app-icon";
import { ArrowUpRightIcon, CheckIcon } from "@/lib/icons/app-icons";
import type { PlanCta, PlanCtaLabelKey } from "@/lib/billing/plan-cta";

type PhoneAddonCardProps = {
  eyebrow: string;
  title: string;
  blurb: string;
  monthlyLabel: string;
  packPrice: string;
  packIncludes: string;
  perMonthLabel: string;
  extraLineLabel: string;
  extraLinePrice: string;
  extraAccountLabel: string;
  extraAccountPrice: string;
  overageText: string;
  features: string[];
  eligibility: string;
  cta: PlanCta;
  ctaLabels: Record<PlanCtaLabelKey, string>;
};

export function PhoneAddonCard({
  eyebrow,
  title,
  blurb,
  monthlyLabel,
  packPrice,
  packIncludes,
  perMonthLabel,
  extraLineLabel,
  extraLinePrice,
  extraAccountLabel,
  extraAccountPrice,
  overageText,
  features,
  eligibility,
  cta,
  ctaLabels,
}: PhoneAddonCardProps) {
  return (
    <section className="mt-12 rounded-xxl border border-hairline bg-surface-card p-8 md:p-10">
      <p className="text-caption-uppercase text-muted">{eyebrow}</p>
      <h2 className="mt-3 font-display text-display-sm tracking-tighter text-ink">{title}</h2>
      <p className="mt-3 max-w-[62ch] text-body-sm leading-relaxed text-body text-pretty">{blurb}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <ul className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AppIcon icon={CheckIcon} className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="text-body-sm leading-snug text-body">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-5 rounded-xl bg-surface-strong/40 p-6 md:min-w-[280px]">
          <div>
            <p className="text-caption-uppercase text-muted">{monthlyLabel}</p>
            <p className="mt-1 font-display text-display-sm tracking-tighter text-ink">{packPrice}</p>
            <p className="mt-1 text-caption leading-relaxed text-muted">{perMonthLabel}</p>
            <p className="mt-2 text-caption leading-relaxed text-muted-soft">{packIncludes}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-caption leading-relaxed text-body">{extraLineLabel}</span>
              <span className="text-caption font-medium text-ink">{extraLinePrice}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-caption leading-relaxed text-body">{extraAccountLabel}</span>
              <span className="text-caption font-medium text-ink">{extraAccountPrice}</span>
            </div>
            <p className="pt-1 text-caption leading-relaxed text-muted-soft">{overageText}</p>
          </div>
          <PlanCtaButton
            cta={cta}
            labels={ctaLabels}
            compact
            className="mt-auto w-full md:w-auto"
            trailing={<AppIcon icon={ArrowUpRightIcon} className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </div>

      <p className="mt-6 max-w-[70ch] text-caption leading-relaxed text-muted">{eligibility}</p>
    </section>
  );
}