import { getTranslations } from "next-intl/server";

import { FaqList } from "./FaqList";

export async function FaqSection() {
  const t = await getTranslations("landing.faq");

  const items = [
    { key: "difference", q: t("items.difference.q"), a: t("items.difference.a") },
    { key: "adapt", q: t("items.adapt.q"), a: t("items.adapt.a") },
    { key: "resolve", q: t("items.resolve.q"), a: t("items.resolve.a") },
    { key: "channels", q: t("items.channels.q"), a: t("items.channels.a") },
    { key: "privacy", q: t("items.privacy.q"), a: t("items.privacy.a") },
    { key: "cancel", q: t("items.cancel.q"), a: t("items.cancel.a") },
  ];

  return (
    <section className="bg-canvas-warm pb-[104px] pt-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="max-w-[760px]">
          <p className="flex items-center gap-2 text-[13px] font-medium leading-none text-warm-body">
            <span aria-hidden className="size-1 rounded-full bg-warm-body" />
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[52px]">
            <span className="block">{t("title")}</span>
            <span className="block text-warm-body">{t("titleMuted")}</span>
          </h2>
        </div>

        <FaqList items={items} />
      </div>
    </section>
  );
}
