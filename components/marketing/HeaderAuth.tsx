"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function HeaderAuth() {
  const { isLoaded } = useAuth();
  const t = useTranslations("common");

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 animate-pulse rounded-md bg-surface-strong" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <Link href="/sign-in" className="btn-outline">
          {t("signIn")}
        </Link>
        <Link href="/sign-up" className="btn-primary">
          {t("getStarted")}
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="btn-outline">
          {t("dashboard")}
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
