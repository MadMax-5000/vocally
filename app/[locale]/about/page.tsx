import { getTranslations } from "next-intl/server";

import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/routing";
import { BRAND_EMAILS, BRAND_NAME } from "@/lib/constants/brand";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { localizedPageMetadata } from "@/lib/seo/metadata";

/**
 * The entity page.
 *
 * Assistants answer "what is X" and "who is X for" questions from whatever they can
 * retrieve, and an about page that states the company, the product, the languages and the
 * market in plain sentences is the cheapest way to be described correctly instead of
 * approximated. The same facts are in the JSON-LD Organization and in /llms-full.txt.
 */

const container = "mx-auto w-full max-w-[1200px] px-6";

const CAPABILITY_ITEMS = ["0", "1", "2", "3", "4"] as const;
const AUDIENCE_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const COMPLIANCE_ITEMS = ["0", "1", "2", "3"] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return localizedPageMetadata(locale, "about");
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("about");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: BRAND_NAME, path: "/" },
          { name: t("title"), path: "/about" },
        ])}
      />
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">{t("eyebrow")}</p>
        <h1 className="mt-4 max-w-[22ch] font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          {t("title")}
        </h1>
        <div className="mt-6 max-w-[70ch] space-y-4 text-body-md leading-relaxed text-body text-pretty">
          <p>{t("intro")}</p>
          <p>{t("introDetail")}</p>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-display-md tracking-tight text-ink">
            {t("capabilities.title")}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {CAPABILITY_ITEMS.map((index) => (
              <li
                key={index}
                className="rounded-xl border border-hairline bg-surface-card p-5 text-body-sm leading-relaxed text-body"
              >
                {t(`capabilities.items.${index}`)}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <section>
            <h2 className="font-display text-display-md tracking-tight text-ink">
              {t("audience.title")}
            </h2>
            <ul className="mt-6 space-y-3">
              {AUDIENCE_ITEMS.map((index) => (
                <li key={index} className="flex gap-3 text-body-md leading-relaxed text-body">
                  <span aria-hidden className="mt-3 size-1 shrink-0 rounded-full bg-muted" />
                  <span>{t(`audience.items.${index}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-display-md tracking-tight text-ink">
              {t("howItWorks.title")}
            </h2>
            <ol className="mt-6 space-y-6">
              {STEP_ITEMS.map((index) => (
                <li key={index}>
                  <h3 className="text-title-md text-ink">{t(`howItWorks.steps.${index}.title`)}</h3>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-body">
                    {t(`howItWorks.steps.${index}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-display-md tracking-tight text-ink">
            {t("company.title")}
          </h2>
          <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
            <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <dt className="text-caption-uppercase text-muted">{t("company.rows.located.label")}</dt>
              <dd className="text-body-md leading-relaxed text-body">{t("company.rows.located.value")}</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <dt className="text-caption-uppercase text-muted">{t("company.rows.product.label")}</dt>
              <dd className="text-body-md leading-relaxed text-body">{t("company.rows.product.value")}</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <dt className="text-caption-uppercase text-muted">{t("company.rows.languages.label")}</dt>
              <dd className="text-body-md leading-relaxed text-body">
                {t("company.rows.languages.value")}
              </dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <dt className="text-caption-uppercase text-muted">{t("company.rows.site.label")}</dt>
              <dd className="text-body-md leading-relaxed text-body">
                {t("company.rows.site.value")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-display-md tracking-tight text-ink">
            {t("compliance.title")}
          </h2>
          <p className="mt-4 max-w-[70ch] text-body-md leading-relaxed text-body text-pretty">
            {t("compliance.body")}
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {COMPLIANCE_ITEMS.map((index) => (
              <li
                key={index}
                className="rounded-xl border border-hairline bg-surface-card p-5 text-body-sm leading-relaxed text-body"
              >
                {t(`compliance.items.${index}`)}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-hairline bg-surface-card p-8">
          <h2 className="font-display text-display-sm tracking-tight text-ink">{t("cta.title")}</h2>
          <p className="mt-3 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
            {t("cta.body")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-button text-on-primary transition-colors hover:bg-primary-active"
            >
              {t("cta.primary")}
            </Link>
            <a
              href={`mailto:${BRAND_EMAILS.contact}`}
              className="text-button text-ink underline-offset-4 transition-colors hover:text-muted hover:underline"
            >
              {BRAND_EMAILS.contact}
            </a>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </main>
  );
}
