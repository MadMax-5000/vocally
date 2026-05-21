import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import "./globals.css";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Vocally",
  description: "AI-first Contact Center as a Service (CCaaS)",
  icons: {
    icon: [{ url: "/images/favicon.ico", sizes: "any" }],
    apple: [{ url: "/images/favicon.ico" }],
  },
  openGraph: {
    title: "Vocally",
    description: "AI-first Contact Center as a Service (CCaaS)",
    images: [{ url: "/images/logo-primary-color.png", width: 1254, height: 1254, alt: "Vocally" }],
  },
  twitter: {
    card: "summary",
    title: "Vocally",
    description: "AI-first Contact Center as a Service (CCaaS)",
    images: ["/images/logo-primary-color.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-canvas text-ink text-pretty">
        <ClerkProvider>{children}</ClerkProvider>
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

