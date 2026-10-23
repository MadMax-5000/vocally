import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");
  const tc = await getTranslations("common");

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#141210] md:min-h-[100dvh]">
      {/* Full-bleed background */}
      <Image
        src="/images/hero-background.webp"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />

      {/* Legibility scrims — top band for the nav, soft center and bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/15 to-black/55"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.28)_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 pb-10 pt-32 sm:pt-36">
        <div className="flex flex-1 flex-col items-center justify-center pt-8 text-center sm:pt-12">
          <h1 className="max-w-[1100px] text-balance font-display text-[40px] font-normal leading-[46px] tracking-[-2.4px] text-[#f5f5f5] sm:text-[60px] sm:leading-[67px] lg:text-[82px] lg:leading-[90px]">
            <span className="block">{t("titleLine1")}</span>
            <span className="block">
              {t("titleLine2Prefix") ? `${t("titleLine2Prefix")} ` : ""}
              {t("titleAccent")}
              {t("titleAfterAccent")}
            </span>
          </h1>

          <p className="subheading-lg mt-7 max-w-[720px] text-pretty text-[#f5f5f5e0] lg:max-w-none lg:whitespace-nowrap">
            {t("subtitle")}
          </p>

          <div className="mt-9">
            <Link href="/sign-up" className="btn-white h-10 justify-center px-7">
              {tc("tryFree")}
            </Link>
          </div>

          {/* Partner logo — rendered white over the photograph */}
          <Image
            src="/images/company1.svg"
            alt=""
            width={797}
            height={386}
            aria-hidden
            className="mt-20 h-auto w-[144px] brightness-0 invert opacity-90 sm:mt-28"
          />
        </div>
      </div>
    </section>
  );
}
