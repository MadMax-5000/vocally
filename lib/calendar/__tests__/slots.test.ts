import { describe, expect, it } from "vitest";

import {
  generateSlotsFromBusy,
  intervalsOverlap,
  slotIsFree,
  zonedWallClockToUtc,
} from "@/lib/calendar/slots";

describe("calendar slots", () => {
  it("detects overlapping intervals", () => {
    const aStart = new Date("2026-08-31T09:00:00.000Z");
    const aEnd = new Date("2026-08-31T09:30:00.000Z");
    const bStart = new Date("2026-08-31T09:15:00.000Z");
    const bEnd = new Date("2026-08-31T09:45:00.000Z");
    expect(intervalsOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    expect(slotIsFree(aStart, aEnd, [{ start: bStart, end: bEnd }])).toBe(false);
    expect(
      slotIsFree(aStart, aEnd, [
        { start: new Date("2026-08-31T10:00:00.000Z"), end: new Date("2026-08-31T10:30:00.000Z") },
      ]),
    ).toBe(true);
  });

  it("builds weekday slots inside working hours and skips busy blocks", () => {
    const from = zonedWallClockToUtc("2026-08-31", "00:00", "Africa/Casablanca");
    const to = zonedWallClockToUtc("2026-08-31", "23:59", "Africa/Casablanca");
    const now = zonedWallClockToUtc("2026-08-31", "08:00", "Africa/Casablanca");
    const busyStart = zonedWallClockToUtc("2026-08-31", "09:00", "Africa/Casablanca");
    const busyEnd = zonedWallClockToUtc("2026-08-31", "09:30", "Africa/Casablanca");

    const slots = generateSlotsFromBusy({
      from,
      to,
      now,
      busy: [{ start: busyStart, end: busyEnd }],
      workingHours: { days: [1], start: "09:00", end: "11:00" },
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      timeZone: "Africa/Casablanca",
    });

    const times = slots.map((slot) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Casablanca",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(slot.start),
    );
    expect(times).toEqual(["09:30", "10:00", "10:30"]);
  });

  it("does not offer slots outside working hours", () => {
    const from = zonedWallClockToUtc("2026-08-31", "00:00", "Africa/Casablanca");
    const to = zonedWallClockToUtc("2026-08-31", "23:59", "Africa/Casablanca");
    const now = zonedWallClockToUtc("2026-08-31", "08:00", "Africa/Casablanca");

    const slots = generateSlotsFromBusy({
      from,
      to,
      now,
      busy: [],
      workingHours: { days: [1], start: "09:00", end: "10:00" },
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      timeZone: "Africa/Casablanca",
    });

    expect(slots).toHaveLength(2);
    expect(slots.every((slot) => slot.start >= zonedWallClockToUtc("2026-08-31", "09:00", "Africa/Casablanca"))).toBe(
      true,
    );
    expect(slots.every((slot) => slot.end <= zonedWallClockToUtc("2026-08-31", "10:00", "Africa/Casablanca"))).toBe(
      true,
    );
  });
});
