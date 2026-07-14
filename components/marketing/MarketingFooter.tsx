import { Link } from "@/i18n/routing";
import Image from "next/image";
import { BRAND_LEGAL_NAME } from "@/lib/constants/brand";
import { useTranslations } from "next-intl";

const container = "mx-auto w-full max-w-[1200px] px-6";

type SocialLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const Instagram: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="https://thesvg.org/icons/instagram/mono.svg"
    alt="Instagram"
    width={24}
    height={24}
    className={className}
  />
);

const X: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="https://thesvg.org/icons/x/default.svg"
    alt="Instagram"
    width={24}
    height={24}
    className={className}
  />
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="/icons/linkedin.svg"
    alt="Instagram"
    width={24}
    height={24}
    className={className}
  />
);


const socials: SocialLink[] = [
  { label: "X", href: "#", icon: X },
  { label: "LinkedIn", href: "#", icon:  LinkedinIcon},
  { label: "Instagram", href: "#", icon: Instagram },
];

export function MarketingFooter() {
  const t = useTranslations("common");
  return (
    <footer className="bg-canvas text-ink">
      <div className="border-t border-hairline">
        <div className={[container, "flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between"].join(" ")}>
          <div className="font-display text-[clamp(32px,5vw,56px)] font-normal leading-[1.1] tracking-tighter text-ink">
            {t("howCanWeHelp")}{" "}
            <Link
              href="/contact"
              className="text-ink underline decoration-primary decoration-[4px] underline-offset-[8px] transition-colors hover:text-primary"
            >
              {t("contactUs")}
            </Link>
          </div>

          <nav aria-label="Social links" className="flex items-center gap-3 pb-2">
            {socials.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={[
                    "inline-flex h-12 w-12 items-center justify-center rounded-full",
                    "text-ink transition hover:bg-surface-strong hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  ].join(" ")}
                  aria-label={item.label}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                >
                  <Icon className="h-6 w-6" aria-hidden={true} />
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-hairline overflow-hidden">
        <div className={[container, "flex justify-center py-16 sm:py-24"].join(" ")}>
          <div 
            className="select-none font-display font-normal leading-[0.75] tracking-[-0.04em] text-ink w-full text-center"
            style={{ fontSize: "clamp(60px, 18.5vw, 290px)" }}
          >
            anselio
          </div>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className={[container, "flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"].join(" ")}>
          <div className="text-body-sm text-muted">
            © {new Date().getFullYear()} {BRAND_LEGAL_NAME} &middot; Operated by Yassir Hannaoui &middot; DB Fouarat Lot Tafraout Rue 01 No 7 Hay Mohammadi, 20000 Casablanca, Morocco
          </div>

          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-muted">
            <Link
              href="/terms"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/privacy"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {t("privacyNotice")}
            </Link>
            <Link
              href="/cookies"
              className="underline decoration-hairline-strong underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {t("cookieNotice")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

