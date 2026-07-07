import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";
import { getTranslations } from "next-intl/server";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");

  // We loop over sections 0 to 10
  const sections = Array.from({ length: 11 }).map((_, i) => ({
    title: t(`sections.${i}.title`, { default: "" }),
    content: t.raw(`sections.${i}.content`)
  })).filter(s => s.title !== "");

  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          {t("title")}
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-6 text-body-md leading-relaxed text-body text-pretty">
          <p>
            <strong className="text-ink">{t("lastUpdated")}</strong>
          </p>

          {sections.map((section: any, index: number) => (
            <section key={index} className="space-y-3">
              <h2 className="text-display-xs font-display tracking-tight text-ink">{section.title}</h2>
              {Array.isArray(section.content) ? (
                <ul className="list-disc pl-6 space-y-1.5">
                  {section.content.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : typeof section.content === 'object' && section.content !== null ? (
                <>
                  {section.content.intro && <p>{section.content.intro}</p>}
                  {section.content.list && (
                    <ul className="list-disc pl-6 space-y-1.5">
                      {section.content.list.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.content.outro && <p>{section.content.outro}</p>}
                </>
              ) : (
                <p>{section.content}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
