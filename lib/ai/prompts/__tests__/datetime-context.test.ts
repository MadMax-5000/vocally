import { describe, expect, it } from "vitest";

import { formatInTimeZone } from "@/lib/calendar/slots";
import {
  buildDateTimeContextSection,
  resolvePromptTimeZone,
} from "@/lib/ai/prompts/datetime-context";

describe("buildDateTimeContextSection", () => {
  it("formats the given instant in the requested timezone", () => {
    const now = new Date("2026-08-31T18:44:00.000Z");
    const timeZone = "Africa/Casablanca";
    const { date, time } = formatInTimeZone(now, timeZone);
    const section = buildDateTimeContextSection(timeZone, now);

    expect(section).toContain("## Current date and time");
    expect(section).toContain(`(${date})`);
    expect(section).toContain(`Current local time: ${time}.`);
    expect(section).toContain("Africa/Casablanca");
    expect(section).toContain("only source of truth");
    expect(section).toContain("Never invent or recall dates from memory.");
    expect(section).not.toContain("2024");
  });

  it("falls back to Casablanca when timezone is blank", () => {
    expect(resolvePromptTimeZone(undefined)).toBe("Africa/Casablanca");
    expect(resolvePromptTimeZone("  ")).toBe("Africa/Casablanca");
  });
});
