import { describe, expect, it } from "vitest";
import {
  isMoroccanE164,
  normalizeE164,
  toMoroccanUssdDestination,
} from "@/lib/telephony/e164";

describe("normalizeE164", () => {
  it("strips spaces and dashes", () => {
    expect(normalizeE164("+212 6 12-34-56-78")).toBe("+212612345678");
  });

  it("converts 00 prefix to +", () => {
    expect(normalizeE164("00212612345678")).toBe("+212612345678");
  });

  it("adds + when digits-only", () => {
    expect(normalizeE164("212612345678")).toBe("+212612345678");
  });

  it("maps Moroccan national 06/05 to +212", () => {
    expect(normalizeE164("0612345678")).toBe("+212612345678");
    expect(normalizeE164("0522123456")).toBe("+212522123456");
    expect(normalizeE164("06 12 34 56 78")).toBe("+212612345678");
  });
});

describe("isMoroccanE164", () => {
  it("accepts valid +212 mobile/landline length", () => {
    expect(isMoroccanE164("+212612345678")).toBe(true);
    expect(isMoroccanE164("+212522123456")).toBe(true);
    expect(isMoroccanE164(" +212 612 345 678 ")).toBe(true);
  });

  it("accepts Moroccan national format", () => {
    expect(isMoroccanE164("0612345678")).toBe(true);
    expect(isMoroccanE164("0522123456")).toBe(true);
  });

  it("rejects non-Moroccan and malformed numbers", () => {
    expect(isMoroccanE164("+15551234567")).toBe(false);
    expect(isMoroccanE164("+21261234567")).toBe(false); // 8 national digits
    expect(isMoroccanE164("+2126123456789")).toBe(false); // 10 national digits
    expect(isMoroccanE164("612345678")).toBe(false); // missing leading 0 / country
  });
});

describe("toMoroccanUssdDestination", () => {
  it("converts E.164 to national digits without +", () => {
    expect(toMoroccanUssdDestination("+212612345678")).toBe("0612345678");
    expect(toMoroccanUssdDestination("+212522123456")).toBe("0522123456");
  });

  it("accepts national input and returns national digits", () => {
    expect(toMoroccanUssdDestination("0612345678")).toBe("0612345678");
  });

  it("never includes a + character", () => {
    expect(toMoroccanUssdDestination("+212612345678")).not.toContain("+");
    expect(toMoroccanUssdDestination("+15551234567")).not.toContain("+");
  });
});
