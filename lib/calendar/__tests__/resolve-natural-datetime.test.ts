import { describe, expect, it } from "vitest";

import {
  resolveNaturalDate,
  resolveNaturalTime,
} from "@/lib/calendar/resolve-natural-datetime";

describe("resolveNaturalDate", () => {
  const now = new Date("2026-08-31T18:44:00.000Z");
  const timeZone = "Africa/Casablanca";

  it("passes through YYYY-MM-DD", () => {
    expect(resolveNaturalDate("2026-09-01", timeZone, now)).toBe("2026-09-01");
  });

  it("resolves today and tomorrow in the given timezone", () => {
    expect(resolveNaturalDate("aujourd'hui", timeZone, now)).toBe("2026-08-31");
    expect(resolveNaturalDate("today", timeZone, now)).toBe("2026-08-31");
    expect(resolveNaturalDate("demain", timeZone, now)).toBe("2026-09-01");
    expect(resolveNaturalDate("tomorrow", timeZone, now)).toBe("2026-09-01");
  });

  it("returns null for unknown input", () => {
    expect(resolveNaturalDate("lundi prochain", timeZone, now)).toBeNull();
    expect(resolveNaturalDate("", timeZone, now)).toBeNull();
  });
});

describe("resolveNaturalTime", () => {
  it("passes through HH:MM", () => {
    expect(resolveNaturalTime("09:30")).toBe("09:30");
  });

  it("maps midi, minuit, and French hour forms", () => {
    expect(resolveNaturalTime("midi")).toBe("12:00");
    expect(resolveNaturalTime("noon")).toBe("12:00");
    expect(resolveNaturalTime("minuit")).toBe("00:00");
    expect(resolveNaturalTime("10h")).toBe("10:00");
    expect(resolveNaturalTime("10h matin")).toBe("10:00");
    expect(resolveNaturalTime("10h30")).toBe("10:30");
  });

  it("returns null for unknown input", () => {
    expect(resolveNaturalTime("matin")).toBeNull();
    expect(resolveNaturalTime("")).toBeNull();
  });
});
