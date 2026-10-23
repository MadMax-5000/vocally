import { getTranslations } from "next-intl/server";

import { AppIcon } from "@/components/ui/app-icon";
import { DatabaseIcon, Shield, UserIcon } from "@/lib/icons/app-icons";

export async function SecuritySection() {
  const t = await getTranslations("landing.security");

  const cards = [
    {
      key: "control",
      icon: UserIcon,
      title: t("cards.control.title"),
      body: t("cards.control.body"),
    },
    {
      key: "encryption",
      icon: Shield,
      title: t("cards.encryption.title"),
      body: t("cards.encryption.body"),
    },
    {
      key: "data",
      icon: DatabaseIcon,
      title: t("cards.data.title"),
      body: t("cards.data.body"),
    },
  ];

  return (
    <section className="bg-canvas-warm py-section">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="flex items-center justify-center gap-2 text-[13px] font-medium leading-none text-warm-body">
            <span aria-hidden className="size-1 rounded-full bg-warm-body" />
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[52px]">
            <span className="block">{t("title")}</span>
            <span className="block text-warm-body">{t("titleMuted")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] font-body text-[18px] font-normal leading-[27px] tracking-[0.14px] text-warm-body">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.key}
              className="flex min-h-[184px] flex-col rounded-[16px] border border-hairline/70 bg-surface-card p-6"
            >
              <AppIcon icon={card.icon} size={22} strokeWidth={1.7} className="text-ink" />
              <div className="mt-auto pt-10">
                <h3 className="font-display text-[24px] font-normal leading-[1.2] tracking-[-0.5px] text-ink">
                  {card.title}
                </h3>
                <p className="mt-2 font-body text-[18px] font-normal leading-[27px] tracking-[0.14px] text-warm-body">
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
