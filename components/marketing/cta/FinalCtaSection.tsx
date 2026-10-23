import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

import { InboxPreview } from "./InboxPreview";

export async function FinalCtaSection() {
  const t = await getTranslations("landing.cta");

  return (
    <section className="bg-canvas-warm pb-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="relative overflow-hidden rounded-[24px] bg-surface-warm">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-12 sm:px-12 sm:py-16 lg:py-20">
              <h2 className="font-display text-[36px] leading-[1.04] tracking-[-2.4px] text-black sm:text-[44px]">
                <span className="block">{t("title")}</span>
                <span className="block text-warm-body">{t("titleMuted")}</span>
              </h2>
              <p className="mt-5 max-w-[44ch] font-body text-[18px] font-normal leading-[27px] tracking-[0.14px] text-warm-body">
                {t("body")}
              </p>
              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center justify-center rounded-[10px] bg-ink px-6 font-body text-[15px] font-medium text-white transition-colors hover:bg-ink/90"
                >
                  {t("button")}
                </Link>
              </div>
            </div>

            <div className="relative min-h-[320px] sm:min-h-[400px] lg:min-h-[460px]">
              <Image
                src="/images/cards-background3.webp"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 648px, 100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-4 sm:inset-5 lg:inset-6">
                <InboxPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
