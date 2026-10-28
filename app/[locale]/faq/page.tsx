import { getTranslations } from "next-intl/server";

import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatPrice } from "@/lib/billing/currency";
import { PLAN_PRICES } from "@/lib/billing/plan-features";
import { BRAND_NAME } from "@/lib/constants/brand";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/json-ld";
import { localizedPageMetadata } from "@/lib/seo/metadata";

/**
 * The answer hub.
 *
 * Every question and answer is plain, always-open HTML in one page, which is the format
 * assistants excerpt most easily. The six questions shared with the home page reuse the
 * same message keys, so the two surfaces cannot drift apart, and the FAQPage markup is
 * emitted only where the answers are actually visible.
 */

const container = "mx-auto w-full max-w-[1200px] px-6";

/** Answer groups, in reading order. Keys resolve from either message namespace. */
const GROUPS = [
  { id: "understanding", keys: ["difference", "adapt", "resolve", "setup"] },
  { id: "channels", keys: ["channels", "darija", "voiceNumber"] },
  { id: "pricing", keys: ["pricing", "freePlan", "cancel"] },
  { id: "trust", keys: ["privacy", "humanHandoff"] },
] as const;

const SHARED_KEYS = ["difference", "adapt", "resolve", "channels", "privacy", "cancel"];

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return localizedPageMetadata(locale, "faq");
}

export default async function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("faqPage");
  const shared = await getTranslations("landing.faq.items");
  const page = await getTranslations("faqPage.items");

  const priceParams = {
    free: formatPrice(PLAN_PRICES.FREE.madCents),
    starter: formatPrice(PLAN_PRICES.STARTER.madCents),
    pro: formatPrice(PLAN_PRICES.PRO.madCents),
  };

  const item = (key: string) =>
    SHARED_KEYS.includes(key)
      ? { key, q: shared(`${key}.q`), a: shared(`${key}.a`) }
      : { key, q: page(`${key}.q`), a: page(`${key}.a`, priceParams) };

  const groups = GROUPS.map((group) => ({
    id: group.id,
    title: t(`groups.${group.id}`),
    items: group.keys.map((key) => item(key)),
  }));
  const allItems = groups.flatMap((group) => group.items);

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <JsonLd
        data={[
          faqPageJsonLd(allItems.map(({ q, a }) => ({ q, a }))),
          breadcrumbJsonLd(locale, [
            { name: BRAND_NAME, path: "/" },
            { name: t("title"), path: "/faq" },
          ]),
        ]}
      />
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">{t("eyebrow")}</p>
        <h1 className="mt-4 max-w-[20ch] font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
          {t("intro")}
        </p>

        <div className="mt-16 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <nav aria-label={t("groupsLabel")} className="lg:sticky lg:top-8 lg:self-start">
            <ul className="space-y-3">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className="text-body-sm text-body transition-colors hover:text-ink"
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14">
            {groups.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-8">
                <h2 className="font-display text-display-md tracking-tight text-ink">
                  {group.title}
                </h2>
                <dl className="mt-6 space-y-8">
                  {group.items.map((entry) => (
                    <div key={entry.key}>
                      <dt className="text-title-md text-ink">{entry.q}</dt>
                      <dd className="mt-2 max-w-[70ch] text-body-md leading-relaxed text-body text-pretty">
                        {entry.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
