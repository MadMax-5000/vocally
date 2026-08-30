import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR, arSA, enUS } from "@clerk/localizations";
import { Toaster } from "sonner";
import { BRAND_NAME } from "@/lib/constants/brand";
import { getLocale } from "next-intl/server";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_METADATA_BASE,
} from "@/lib/seo/metadata";

import "./globals.css";
import { inter, instrumentSerif } from "./fonts";

export const metadata: Metadata = {
  metadataBase: SITE_METADATA_BASE,
  title: BRAND_NAME,
  verification: {
    other: {
      "facebook-domain-verification": "qmpiaomgr6t1kzar7bomnz1kkve7yr",
    },
  },
  icons: {
    icon: [{ url: "/images/favicon.ico", sizes: "any" }],
    apple: [{ url: "/images/logo-primary-color.png" }],
  },
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE_PATH],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  let localization = enUS;
  if (locale === "fr") localization = frFR;
  if (locale === "ar") localization = arSA;

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans bg-canvas text-ink text-pretty">
        <ClerkProvider
          localization={localization}
          signInFallbackRedirectUrl={`/${locale}/dashboard`}
          signUpFallbackRedirectUrl={`/${locale}/onboarding`}
        >
          {children}
        </ClerkProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "16px",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}

