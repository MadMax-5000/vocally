import { getTranslations } from "next-intl/server";

import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/routing";
import { BRAND_NAME } from "@/lib/constants/brand";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { localizedPageMetadata } from "@/lib/seo/metadata";

/**
 * The comparison page.
 *
 * "Alternatives to X" and "X vs Y" prompts are where assistants make recommendations, and
 * a page that lays out the criteria side by side is the easiest thing for one to quote.
 * The comparison is made at category level, against a traditional phone menu and against
 * international voice platforms used from abroad, because that is what buyers actually
 * weigh up. No claim is made about a named competitor anywhere: if those pages are added
 * later, every statement on them has to be verifiable and dated.
 *
 * The "not the right fit" block is deliberate. Stating where the product does not fit is
 * what makes the rest of the page quotable, and it is the honest thing to do.
 */

const container = "mx-auto w-full max-w-[1200px] px-6";

const CRITERIA = ["darija", "number", "channels", "handoff", "billing", "setup"] as const;
const FIT_ITEMS = ["0", "1", "2"] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return localizedPageMetadata(locale, "compare");
}

export default async function ComparePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("compare");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: BRAND_NAME, path: "/" },
          { name: t("title"), path: "/compare" },
        ])}
      />
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">{t("eyebrow")}</p>
        <h1 className="mt-4 max-w-[24ch] font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
          {t("intro")}
        </p>

        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-start">
            <caption className="sr-only">{t("tableCaption")}</caption>
            <thead>
              <tr className="border-b border-hairline-strong">
                <th scope="col" className="pb-4 pe-6 text-start text-caption-uppercase text-muted">
                  {t("columns.criteria")}
                </th>
                <th scope="col" className="pb-4 pe-6 text-start text-caption-uppercase text-ink">
                  {t("columns.anselio")}
                </th>
                <th scope="col" className="pb-4 pe-6 text-start text-caption-uppercase text-muted">
                  {t("columns.ivr")}
                </th>
                <th scope="col" className="pb-4 text-start text-caption-uppercase text-muted">
                  {t("columns.global")}
                </th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((criterion) => (
                <tr key={criterion} className="border-b border-hairline align-top">
                  <th
                    scope="row"
                    className="w-[22%] py-5 pe-6 text-start text-title-sm text-ink"
                  >
                    {t(`criteria.${criterion}.label`)}
                  </th>
                  <td className="w-[28%] py-5 pe-6 text-body-sm leading-relaxed text-body">
                    {t(`criteria.${criterion}.anselio`)}
                  </td>
                  <td className="w-[25%] py-5 pe-6 text-body-sm leading-relaxed text-muted">
                    {t(`criteria.${criterion}.ivr`)}
                  </td>
                  <td className="w-[25%] py-5 text-body-sm leading-relaxed text-muted">
                    {t(`criteria.${criterion}.global`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-hairline bg-surface-card p-6">
            <h2 className="font-display text-display-sm tracking-tight text-ink">
              {t("fit.title")}
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-body text-pretty">
              {t("fit.body")}
            </p>
            <ul className="mt-5 space-y-3">
              {FIT_ITEMS.map((index) => (
                <li key={index} className="flex gap-3 text-body-sm leading-relaxed text-body">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted" />
                  <span>{t(`fit.items.${index}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-hairline bg-surface-card p-6">
            <h2 className="font-display text-display-sm tracking-tight text-ink">
              {t("notFit.title")}
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-body text-pretty">
              {t("notFit.body")}
            </p>
            <ul className="mt-5 space-y-3">
              {FIT_ITEMS.map((index) => (
                <li key={index} className="flex gap-3 text-body-sm leading-relaxed text-body">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted" />
                  <span>{t(`notFit.items.${index}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-button text-on-primary transition-colors hover:bg-primary-active"
          >
            {t("cta.primary")}
          </Link>
          <Link
            href="/pricing"
            className="text-button text-ink underline-offset-4 transition-colors hover:text-muted hover:underline"
          >
            {t("cta.secondary")}
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
