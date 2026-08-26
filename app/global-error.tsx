"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";
import { inter } from "./fonts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-canvas text-ink text-pretty">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-display-sm font-display tracking-tight text-ink">
            Something went wrong
          </h1>
          <p className="text-body-sm text-muted">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
