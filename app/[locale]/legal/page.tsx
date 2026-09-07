import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";
import { getTranslations } from "next-intl/server";
import { BRAND_EMAILS, BRAND_LEGAL_ADDRESS, BRAND_LEGAL_NAME } from "@/lib/constants/brand";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return localizedPageMetadata(locale, "legal");
}

const container = "mx-auto w-full max-w-[1200px] px-6";

export default async function LegalNoticePage() {
  const t = await getTranslations("legal.notice");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          {t("title")}
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-6 text-body-md leading-relaxed text-body text-pretty">
          <p>
            <strong className="text-ink">{t("publisher")}</strong>
            <br />
            {BRAND_LEGAL_NAME}
          </p>
          <p>
            <strong className="text-ink">{t("address")}</strong>
            <br />
            {BRAND_LEGAL_ADDRESS}
          </p>
          <p>
            <strong className="text-ink">{t("contact")}</strong>
            <br />
            <a href={`mailto:${BRAND_EMAILS.legal}`} className="underline underline-offset-2">
              {BRAND_EMAILS.legal}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
