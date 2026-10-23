import { getTranslations } from "next-intl/server";

import { AnselioLogo } from "@/components/brand/AnselioLogo";
import { Link } from "@/i18n/routing";
import { BRAND_LEGAL_NAME, BRAND_NAME } from "@/lib/constants/brand";

import { footerColumns } from "./landing-footer-data";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export async function MarketingFooter() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-16 sm:px-10 md:pt-20 lg:px-16">
        <div className="grid gap-12 md:grid-cols-[1.15fr_2fr] md:gap-16">
          <div>
            <Link
              href="/"
              className={`inline-flex items-center gap-2.5 rounded-md ${focusRing}`}
              aria-label={BRAND_NAME}
            >
              <AnselioLogo variant="white" size="md" />
              <span className="font-display text-[19px] leading-none text-white">{BRAND_NAME}</span>
            </Link>
            <p className="mt-4 max-w-[30ch] font-body text-[14px] font-normal leading-[1.5] tracking-[0.14px] text-white/45">
              {t("headline")}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.id}>
                <p
                  id={`footer-${column.id}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40"
                >
                  {t(`columns.${column.id}`)}
                </p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className={`text-[14px] leading-snug text-white/75 transition-colors hover:text-white ${focusRing}`}
                      >
                        {t(`links.${link.id}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 border-t border-white/10 py-5">
          <p className="text-[12px] leading-relaxed text-white/35">
            © {new Date().getFullYear()} {BRAND_LEGAL_NAME}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-6 [container-type:inline-size] sm:px-10 lg:px-16">
        <div className="relative h-[22cqw] max-h-[260px] min-h-[70px] overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(60%_100%_at_50%_100%,rgba(255,90,54,0.10),transparent_72%)]"
          />
          <p
            aria-hidden
            dir="ltr"
            className="relative block whitespace-nowrap text-center font-display text-[29cqw] leading-none tracking-[-0.055em] text-white/[0.09]"
          >
            {BRAND_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
