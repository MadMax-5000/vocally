"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Link } from "@/i18n/routing";
import type { PaidPlan, PlanCta, PlanCtaLabelKey } from "@/lib/billing/plan-cta";

type PlanCtaButtonProps = {
  cta: PlanCta;
  labels: Record<PlanCtaLabelKey, string>;
  variant?: "pro" | "default";
  className?: string;
  trailing?: ReactNode;
  compact?: boolean;
};

function buttonClassName(variant: "pro" | "default", disabled: boolean, compact: boolean): string {
  const width = compact ? "inline-flex w-auto" : "block w-full";
  const base = `${width} rounded-md px-4 py-2.5 text-center text-button tracking-wide transition-colors`;
  const disabledStyles = disabled ? "cursor-not-allowed opacity-50" : "";

  if (variant === "pro") {
    return `${base} ${disabled ? "bg-white/60 text-primary" : "bg-white text-primary hover:bg-white/90"} ${disabledStyles}`;
  }

  return `${base} ${disabled ? "bg-ink/60 text-on-primary" : "bg-ink text-on-primary hover:bg-body-strong"} ${disabledStyles}`;
}

export function PlanCtaButton({
  cta,
  labels,
  variant = "default",
  className,
  trailing,
  compact = false,
}: PlanCtaButtonProps) {
  const [loading, setLoading] = useState(false);
  const wrapperClass = className ?? "mt-8";

  async function startCheckout(plan: PaidPlan) {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { checkoutUrl?: string };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data?.checkoutUrl) {
        toast.error(json.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      toast.error("Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  const label = loading ? labels.redirecting : labels[cta.labelKey];
  const inlineContent = trailing ? (
    <span className="inline-flex items-center justify-center gap-2">
      {label}
      {trailing}
    </span>
  ) : (
    label
  );

  if (cta.kind === "link") {
    return (
      <Link href={cta.href} className={`${wrapperClass} ${buttonClassName(variant, false, compact)}`}>
        {inlineContent}
      </Link>
    );
  }

  if (cta.kind === "mailto") {
    return (
      <a href={`mailto:${cta.email}`} className={`${wrapperClass} ${buttonClassName(variant, false, compact)}`}>
        {inlineContent}
      </a>
    );
  }

  if (cta.kind === "checkout") {
    return (
      <button
        type="button"
        className={`${wrapperClass} ${buttonClassName(variant, loading, compact)}`}
        disabled={loading}
        onClick={() => void startCheckout(cta.plan)}
      >
        {inlineContent}
      </button>
    );
  }

  return (
    <button type="button" className={`${wrapperClass} ${buttonClassName(variant, true, compact)}`} disabled>
      {inlineContent}
    </button>
  );
}

export function PlanCtaInlineButton({
  cta,
  labels,
  loading,
  checkoutBlocked,
  onCheckout,
}: {
  cta: PlanCta;
  labels: Record<PlanCtaLabelKey, string>;
  loading: boolean;
  checkoutBlocked?: boolean;
  onCheckout: (plan: PaidPlan) => void;
}) {
  const label = loading ? labels.redirecting : labels[cta.labelKey];
  const isDisabled = cta.kind === "disabled" || loading || checkoutBlocked;

  if (cta.kind === "link") {
    return (
      <Link href={cta.href} className="btn-primary shrink-0 tracking-wide">
        {label}
      </Link>
    );
  }

  if (cta.kind === "mailto") {
    return (
      <a href={`mailto:${cta.email}`} className="btn-primary shrink-0 tracking-wide">
        {label}
      </a>
    );
  }

  if (cta.kind === "checkout") {
    return (
      <button
        type="button"
        className="btn-primary shrink-0 tracking-wide"
        disabled={isDisabled}
        onClick={() => onCheckout(cta.plan)}
      >
        {label}
      </button>
    );
  }

  return (
    <button type="button" className="btn-primary shrink-0 tracking-wide" disabled={isDisabled}>
      {label}
    </button>
  );
}
