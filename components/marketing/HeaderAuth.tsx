"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { BookDemoLink } from "@/components/marketing/BookDemoLink";
import { cn } from "@/lib/utils";

type HeaderAuthProps = {
  /** `overlay` = transparent header sitting on the hero photograph. */
  tone?: "default" | "overlay";
};

export function HeaderAuth({ tone = "default" }: HeaderAuthProps) {
  const { isLoaded } = useAuth();
  const t = useTranslations("common");
  const overlay = tone === "overlay";

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-9 w-20 animate-pulse rounded-full",
            overlay ? "bg-white/15" : "bg-surface-strong",
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <SignedOut>
        {overlay ? (
          <>
            <BookDemoLink className="hidden text-[15px] font-medium text-white/85 transition-colors hover:text-white sm:inline">
              {t("bookDemo")}
            </BookDemoLink>
            <Link href="/sign-up" className="btn-white px-6">
              {t("tryFree")}
            </Link>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="btn-outline">
              {t("signIn")}
            </Link>
            <BookDemoLink className="btn-primary">{t("bookDemo")}</BookDemoLink>
          </>
        )}
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={overlay ? "btn-white" : "btn-outline"}>
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
