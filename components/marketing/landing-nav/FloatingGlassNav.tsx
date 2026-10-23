"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AnselioLogo } from "@/components/brand/AnselioLogo";
import { BookDemoLink } from "@/components/marketing/BookDemoLink";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { landingNavLinks } from "./LandingNavDesktop";

/** The pill floats in while this much of the hero is still on screen. */
const REVEAL_OFFSET = 80;

export function FloatingGlassNav() {
  const { isLoaded } = useAuth();
  const t = useTranslations("landing.nav");
  const tc = useTranslations("common");
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector<HTMLElement>("main > section");
      const limit = hero
        ? hero.offsetTop + hero.offsetHeight - REVEAL_OFFSET
        : window.innerHeight;
      setPassed(window.scrollY > limit);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!isLoaded) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-4 z-50 hidden justify-center px-4 transition-all duration-300 ease-out lg:flex",
        passed
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-6 opacity-0",
      )}
      aria-hidden={!passed}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-6 rounded-full border border-white/10 bg-ink/80 py-2.5 pe-2.5 ps-5 shadow-[0_24px_60px_-24px_rgba(12,10,9,0.75)] backdrop-blur-xl",
          !passed && "invisible",
        )}
      >
        <AnselioLogo variant="white" size="sm" href="/" />

        <nav aria-label="Main navigation" className="flex items-center gap-0.5">
          {landingNavLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="inline-flex h-8 items-center rounded-full px-3 text-[14px] font-medium leading-none text-white/75 transition-colors hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <SignedOut>
          <BookDemoLink className="text-[14px] font-medium text-white/80 transition-colors hover:text-white">
            {tc("bookDemo")}
          </BookDemoLink>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center justify-center rounded-full bg-white px-5 text-[14px] font-medium text-ink transition-opacity hover:opacity-90"
          >
            {tc("tryFree")}
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-full bg-white px-5 text-[14px] font-medium text-ink transition-opacity hover:opacity-90"
          >
            {tc("dashboard")}
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
    </div>
  );
}
