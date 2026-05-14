import Link from "next/link";

import { auth } from "@clerk/nextjs/server";
import { getVariant } from "@/lib/billing/lemonsqueezy";
import { formatVariantPrice } from "@/lib/billing/format-price";
import { variantIdForPlan } from "@/lib/billing/plan-map";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";

const container = "mx-auto w-full max-w-[1200px] px-6";

function envCurrency(): string {
  return process.env.LEMONSQUEEZY_PRICE_CURRENCY?.trim() || "USD";
}

export default async function PricingPage() {
  const { userId, orgId } = await auth();
  const signedIn = !!userId;

  const currency = envCurrency();
  const starterId = variantIdForPlan("STARTER");
  const proId = variantIdForPlan("PRO");
  const enterpriseId = variantIdForPlan("ENTERPRISE");

  const [starterVariant, proVariant, enterpriseVariant] = await Promise.all([
    starterId ? getVariant(starterId) : null,
    proId ? getVariant(proId) : null,
    enterpriseId ? getVariant(enterpriseId) : null,
  ]);

  function ctaHref(): string {
    if (!signedIn) return "/sign-up";
    return orgId ? "/dashboard/billing" : "/onboarding";
  }

  const rows: {
    key: string;
    name: string;
    blurb: string;
    priceLabel: string;
    intervalLabel: string;
    ctaHref: string;
    ctaLabel: string;
  }[] = [
    {
      key: "starter",
      name: "Starter",
      blurb: "Growing teams that need more knowledge capacity and channels.",
      priceLabel: formatVariantPrice(starterVariant?.attributes.price ?? null, currency),
      intervalLabel:
        starterVariant?.attributes.is_subscription && starterVariant.attributes.interval
          ? `Billed every ${starterVariant.attributes.interval_count ?? 1} ${starterVariant.attributes.interval}(s)`
          : starterVariant?.attributes.is_subscription
            ? "Subscription"
            : "Per purchase",
      ctaHref: ctaHref(),
      ctaLabel: "Get started",
    },
    {
      key: "pro",
      name: "Pro",
      blurb: "Production deployments with higher limits and priority workflows.",
      priceLabel: formatVariantPrice(proVariant?.attributes.price ?? null, currency),
      intervalLabel:
        proVariant?.attributes.is_subscription && proVariant.attributes.interval
          ? `Billed every ${proVariant.attributes.interval_count ?? 1} ${proVariant.attributes.interval}(s)`
          : proVariant?.attributes.is_subscription
            ? "Subscription"
            : "Per purchase",
      ctaHref: ctaHref(),
      ctaLabel: "Get started",
    },
    {
      key: "enterprise",
      name: "Enterprise",
      blurb: "Custom contracts, compliance, and dedicated support for large contact centers.",
      priceLabel: enterpriseVariant?.attributes.price != null
        ? formatVariantPrice(enterpriseVariant.attributes.price, currency)
        : "Custom",
      intervalLabel:
        enterpriseVariant?.attributes.is_subscription && enterpriseVariant.attributes.interval
          ? `Billed every ${enterpriseVariant.attributes.interval_count ?? 1} ${enterpriseVariant.attributes.interval}(s)`
          : enterpriseVariant
            ? "Subscription or invoice"
            : "Contact us for a tailored quote",
      ctaHref: ctaHref(),
      ctaLabel: "Get started",
    },
  ];

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className={[container, "flex h-16 items-center justify-between"].join(" ")}>
          <Link
            href="/"
            className="font-display text-title-md tracking-tight text-ink transition hover:text-body-strong"
          >
            Vocally
          </Link>
          <HeaderAuth />
        </div>
      </header>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">Pricing</p>
        <h1 className="font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          Simple plans for AI-first contact centers
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
          Prices are loaded from Lemon Squeezy for accuracy. Sign in and open Billing in the dashboard
          to subscribe.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {rows.map((row) => (
            <article
              key={row.key}
              className="flex flex-col rounded-xl border border-hairline bg-surface-card p-6 shadow-sm"
            >
              <h2 className="font-display text-display-sm tracking-tighter text-ink">{row.name}</h2>
              <p className="mt-3 text-body-sm leading-relaxed text-body text-pretty">{row.blurb}</p>
              <p className="mt-6 font-display text-display-md tracking-tighter text-ink">{row.priceLabel}</p>
              <p className="mt-1 text-caption text-muted">{row.intervalLabel}</p>
              <div className="mt-8 flex flex-1 flex-col justify-end">
                <Link className="btn-primary text-center tracking-wide" href={row.ctaHref}>
                  {row.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
