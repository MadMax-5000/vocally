"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export function HeaderAuth() {
  const { isLoaded } = useAuth();

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
          Sign in
        </Link>
        <Link href="/sign-up" className="btn-primary">
          Get started
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="btn-outline">
          Dashboard
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
