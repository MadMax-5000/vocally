import { getTranslations } from "next-intl/server";

import { EnterpriseContactForm } from "@/components/marketing/EnterpriseContactForm";
import { HeaderAuth } from "@/components/marketing/HeaderAuth";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { AppIcon } from "@/components/ui/app-icon";
import { CheckIcon } from "@/lib/icons/app-icons";

const container = "mx-auto w-full max-w-[1200px] px-6";

const SIDEBAR_FEATURES = ["0", "1", "2", "3"] as const;

export default async function ContactSalesPage() {
  const t = await getTranslations("contact.sales");
  const tc = await getTranslations("contact");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <MarketingHeader>
        <HeaderAuth />
      </MarketingHeader>

      <div className={[container, "py-section"].join(" ")}>
        <p className="text-caption-uppercase text-muted">{tc("title")}</p>
        <h1 className="mt-4 max-w-[20ch] font-display text-display-xl tracking-tighter text-balance text-ink md:text-display-mega">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty rtl:text-start ltr:text-left">
          {t("description")}
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="rounded-xxl border border-hairline bg-surface-card p-8 md:p-10">
            <EnterpriseContactForm />
          </section>

          <aside className="space-y-8">
            <div className="rounded-xxl border border-hairline bg-surface-strong/40 p-6">
              <h2 className="font-display text-display-sm tracking-tighter text-ink">{t("sidebar.responseTitle")}</h2>
              <p className="mt-3 text-body-sm leading-relaxed text-body">{t("sidebar.responseBody")}</p>
            </div>

            <div className="rounded-xxl border border-hairline bg-surface-card p-6">
              <h2 className="font-display text-display-sm tracking-tighter text-ink">{t("sidebar.featuresTitle")}</h2>
              <ul className="mt-4 space-y-3">
                {SIDEBAR_FEATURES.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <AppIcon icon={CheckIcon} className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span className="text-body-sm leading-snug text-body">{t(`sidebar.features.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xxl border border-hairline bg-surface-card p-6 text-body-sm leading-relaxed text-body">
              <p className="text-caption-uppercase text-muted">{tc("phone.title")}</p>
              <p className="mt-2 text-ink">{tc("phone.number")}</p>
              <p className="mt-6 text-caption-uppercase text-muted">{tc("address.title")}</p>
              <p className="mt-2">{tc("address.line1")}</p>
              <p>{tc("address.line2")}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
