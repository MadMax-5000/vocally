"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProgressDots } from "@/components/onboarding/ProgressDots";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: React.ReactNode;
  currentStepIndex: number;
  totalSteps: number;
  showBack?: boolean;
  onBack?: () => void;
  exitHref?: string;
  className?: string;
};

export function OnboardingShell({
  children,
  currentStepIndex,
  totalSteps,
  showBack,
  onBack,
  exitHref = "/dashboard/agents",
  className,
}: OnboardingShellProps) {
  return (
    <div className={cn("relative flex min-h-dvh flex-col bg-surface-card", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-3 sm:px-5">
        <div className="pointer-events-auto">
          {showBack && onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="text-muted hover:text-ink"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <span className="inline-block h-7 w-7" aria-hidden />
          )}
        </div>
        <div className="pointer-events-auto">
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="text-muted hover:text-ink"
          >
            <Link href={exitHref} aria-label="Close and exit">
              <X className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-20 pt-10 sm:pb-24">
        {children}
      </div>

      <div className="fixed bottom-5 left-0 right-0 z-10 flex justify-center px-4 sm:bottom-7">
        <ProgressDots currentIndex={currentStepIndex} total={totalSteps} />
      </div>
    </div>
  );
}
