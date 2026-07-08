import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";
import { getTranslations } from "next-intl/server";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          {t("title")}
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-8 text-body-md leading-relaxed text-body text-pretty">
          <p>{t("description")}</p>

          <div className="space-y-6">
            <div>
              <h2 className="text-display-xs font-display tracking-tight text-ink mb-2">
                {t("email.title")}
              </h2>
              <p>{t("email.support")}</p>
              <p>{t("email.privacy")}</p>
              <p>{t("email.legal")}</p>
            </div>

            <div>
              <h2 className="text-display-xs font-display tracking-tight text-ink mb-2">
                {t("phone.title")}
              </h2>
              <p>{t("phone.number")}</p>
            </div>

            <div>
              <h2 className="text-display-xs font-display tracking-tight text-ink mb-2">
                {t("address.title")}
              </h2>
              <p>{t("address.line1")}</p>
              <p>{t("address.line2")}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
