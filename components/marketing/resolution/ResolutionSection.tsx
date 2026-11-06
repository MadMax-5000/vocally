import { getTranslations } from "next-intl/server";

import { ResolutionChart } from "./ResolutionChart";

type Props = {
  locale: string;
};

export async function ResolutionSection({ locale }: Props) {
  const t = await getTranslations("landing.resolution");

  return (
    <section id="results" className="bg-canvas-warm py-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-14">
          <div className="max-w-[540px]">
            <p className="flex items-center gap-2 text-[13px] font-medium leading-none text-warm-body">
              <span aria-hidden className="size-1 rounded-full bg-warm-body" />
              {t("eyebrow")}
            </p>

            <h2 className="mt-4 font-display text-[34px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[44px]">
              <span className="block">{t("title")}</span>
              <span className="block text-warm-body">{t("titleMuted")}</span>
            </h2>

            <p className="mt-6 font-body text-[18px] font-normal leading-[27px] tracking-[0.14px] text-warm-body">
              {t("body")}
            </p>
            <p className="mt-4 font-body text-[18px] font-normal leading-[27px] tracking-[0.14px] text-warm-body">
              {t("bodySecondary")}
            </p>
          </div>

          <div className="rounded-[20px] border border-hairline/80 bg-surface-card p-4 shadow-[0_30px_70px_-58px_rgba(35,31,24,0.55)] sm:p-6">
            <ResolutionChart
              locale={locale}
              metricLabel={t("metricLabel")}
              legend={t("legend")}
              chartAria={t("chartAria")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
