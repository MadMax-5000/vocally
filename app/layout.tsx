import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Vocally",
  description: "AI-first Contact Center as a Service (CCaaS)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-canvas text-ink text-pretty">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

