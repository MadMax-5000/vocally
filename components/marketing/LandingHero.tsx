import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

import { HeroStageVideo } from "@/components/marketing/HeroStageVideo";

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="bg-surface-card">
      <div
        className={[
          container,
          "grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16",
        ].join(" ")}
      >
        <div className="flex flex-col items-start text-start">
          <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.03em] text-ink md:text-[3.6rem] lg:text-[4rem]">
            <span className="block font-sans font-medium">{t("titleLine1")}</span>
            <span className="block font-sans font-medium">
              {t("titleLine2Prefix") ? `${t("titleLine2Prefix")} ` : ""}
              <span className="font-accent text-[1.05em] font-semibold italic leading-[1.15] tracking-wide">
                {t("titleAccent")}
              </span>
              {t("titleAfterAccent")}
            </span>
          </h1>

          <p className="mt-6 max-w-[48ch] text-pretty font-sans text-[0.9375rem] font-medium leading-[1.55] tracking-tight text-body md:text-[1.0625rem] md:leading-[1.5]">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link className="btn-primary w-full justify-center sm:w-auto" href="/sign-up">
              {t("startFreeTrial")}
            </Link>
            <Link className="btn-outline w-full justify-center sm:w-auto" href="/contact/sales">
              {t("getDemo")}
            </Link>
          </div>
        </div>

        <div className="w-full">
          <HeroStageVideo />
        </div>
      </div>
    </section>
  );
}
