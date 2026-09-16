import { describe, expect, it } from "vitest";

import { CONVERSATION_OVERAGE_MAD_PER_100 } from "@/lib/billing/overage";
import {
  EMAIL_CHANNEL_ENABLED,
  MAX_AGENTS,
  MAX_CALL_MINUTES,
  MAX_CONVERSATIONS,
  MAX_PHONE_NUMBERS,
  MAX_SMS_SEGMENTS,
  MAX_SOCIAL_ACCOUNTS,
  PLAN_PRICES,
} from "@/lib/billing/plan-features";
import {
  PHONE_EXTRA_CONCURRENT_LINE_MONTHLY_MAD_CENTS,
  PHONE_EXTRA_SOCIAL_ACCOUNT_MONTHLY_MAD_CENTS,
  PHONE_OVERAGE_MAD,
  PHONE_PACK_INCLUDED_MINUTES,
  PHONE_PACK_MONTHLY_MAD_CENTS,
  isPhoneAddonEligible,
  monthlyCallMinuteCap,
  phoneNumberSlotLimit,
} from "@/lib/billing/phone-addon";

describe("Anselio Morocco pricing", () => {
  it("prices digital SaaS in MAD HT centimes without .99", () => {
    expect(PLAN_PRICES.FREE.madCents).toBe(0);
    expect(PLAN_PRICES.STARTER.madCents).toBe(100_000);
    expect(PLAN_PRICES.PRO.madCents).toBe(300_000);
  });

  it("includes phone number and voice minutes on Pro only", () => {
    expect(MAX_PHONE_NUMBERS.FREE).toBe(0);
    expect(MAX_PHONE_NUMBERS.STARTER).toBe(0);
    expect(MAX_PHONE_NUMBERS.PRO).toBe(1);
    expect(MAX_PHONE_NUMBERS.ENTERPRISE).toBe(Infinity);
    expect(MAX_CALL_MINUTES.FREE).toBe(0);
    expect(MAX_CALL_MINUTES.STARTER).toBe(0);
    expect(MAX_CALL_MINUTES.PRO).toBe(300);
    expect(MAX_CALL_MINUTES.ENTERPRISE).toBe(Infinity);
  });

  it("caps agents, conversations, SMS, and social accounts per plan", () => {
    expect(MAX_AGENTS.FREE).toBe(1);
    expect(MAX_AGENTS.STARTER).toBe(2);
    expect(MAX_AGENTS.PRO).toBe(5);
    expect(MAX_CONVERSATIONS.FREE).toBe(50);
    expect(MAX_CONVERSATIONS.STARTER).toBe(500);
    expect(MAX_CONVERSATIONS.PRO).toBe(2_000);
    expect(MAX_CONVERSATIONS.ENTERPRISE).toBe(Infinity);
    expect(MAX_SOCIAL_ACCOUNTS.FREE).toBe(0);
    expect(MAX_SOCIAL_ACCOUNTS.STARTER).toBe(3);
    expect(MAX_SOCIAL_ACCOUNTS.PRO).toBe(6);
    expect(MAX_SMS_SEGMENTS.STARTER).toBe(0);
    expect(MAX_SMS_SEGMENTS.PRO).toBe(100);
    expect(EMAIL_CHANNEL_ENABLED.STARTER).toBe(true);
    expect(EMAIL_CHANNEL_ENABLED.PRO).toBe(true);
  });

  it("keeps voice overage on the telephony packs only, above COGS", () => {
    expect(PHONE_OVERAGE_MAD).toBe(3);
    expect(PHONE_PACK_INCLUDED_MINUTES).toBe(300);
    expect(PHONE_PACK_MONTHLY_MAD_CENTS).toBe(150_000);
    expect(PHONE_EXTRA_CONCURRENT_LINE_MONTHLY_MAD_CENTS).toBe(20_000);
    expect(PHONE_EXTRA_SOCIAL_ACCOUNT_MONTHLY_MAD_CENTS).toBe(10_000);
    expect(CONVERSATION_OVERAGE_MAD_PER_100).toBe(10);
    expect(isPhoneAddonEligible("STARTER")).toBe(false);
    expect(isPhoneAddonEligible("PRO")).toBe(true);
    expect(phoneNumberSlotLimit("STARTER")).toBe(0);
    expect(phoneNumberSlotLimit("PRO")).toBe(1);
    expect(phoneNumberSlotLimit("ENTERPRISE")).toBe(Number.POSITIVE_INFINITY);
  });

  it("honors Pro's included pack minutes from plan MAX_CALL_MINUTES", () => {
    expect(monthlyCallMinuteCap("FREE", 0)).toBe(0);
    expect(monthlyCallMinuteCap("STARTER", 0)).toBe(0);
    expect(monthlyCallMinuteCap("PRO", 300)).toBe(PHONE_PACK_INCLUDED_MINUTES);
    expect(monthlyCallMinuteCap("ENTERPRISE", Number.POSITIVE_INFINITY)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});