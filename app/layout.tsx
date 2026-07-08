import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR, arSA, enUS } from "@clerk/localizations";
import { Toaster } from "sonner";
import { BRAND_NAME } from "@/lib/constants/brand";
import { getLocale } from "next-intl/server";

import "./globals.css";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "AI-first Contact Center as a Service (CCaaS)",
  verification: {
    facebook: "qmpiaomgr6t1kzar7bomnz1kkve7yr",
  },
  icons: {
    icon: [{ url: "/images/favicon.ico", sizes: "any" }],
    apple: [{ url: "/images/favicon.ico" }],
  },
  openGraph: {
    title: BRAND_NAME,
    description: "AI-first Contact Center as a Service (CCaaS)",
    images: [{ url: "/images/logo-primary-color.png", width: 1254, height: 1254, alt: BRAND_NAME }],
  },
  twitter: {
    card: "summary",
    title: BRAND_NAME,
    description: "AI-first Contact Center as a Service (CCaaS)",
    images: ["/images/logo-primary-color.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  let localization = enUS;
  if (locale === "fr") localization = frFR;
  if (locale === "ar") localization = arSA;

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-canvas text-ink text-pretty">
        <ClerkProvider localization={localization}>{children}</ClerkProvider>
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

