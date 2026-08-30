import type { WorkingHoursConfig } from "@/lib/deploy/book-appointment-action";

import type { CalendarBusyInterval, CalendarSlot } from "./types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function parseHhMm(value: string): { hours: number; minutes: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function zonedWallClockToUtc(
  ymd: string,
  hm: string,
  timeZone: string,
): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const parsed = parseHhMm(hm);
  if (!parsed || !year || !month || !day) {
    throw new Error("Invalid date or time");
  }
  const utcGuess = Date.UTC(year, month - 1, day, parsed.hours, parsed.minutes, 0);
  const asIfInZone = wallClockAsUtc(new Date(utcGuess), timeZone);
  const offset = asIfInZone - utcGuess;
  return new Date(utcGuess - offset);
}

function wallClockAsUtc(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

export function formatInTimeZone(
  date: Date,
  timeZone: string,
): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function ymdInTimeZone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone).date;
}

export function weekdayInTimeZone(date: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const index = WEEKDAY_SHORT.indexOf(short as (typeof WEEKDAY_SHORT)[number]);
  return index >= 0 ? index : 0;
}

export function eachYmdInRange(
  from: Date,
  to: Date,
  timeZone: string,
): string[] {
  const startYmd = ymdInTimeZone(from, timeZone);
  const endYmd = ymdInTimeZone(addMinutes(to, -1), timeZone);
  const days: string[] = [];
  let cursor = zonedWallClockToUtc(startYmd, "00:00", timeZone);
  const last = zonedWallClockToUtc(endYmd, "00:00", timeZone);
  while (cursor.getTime() <= last.getTime()) {
    days.push(ymdInTimeZone(cursor, timeZone));
    cursor = addMinutes(cursor, 36 * 60);
    cursor = zonedWallClockToUtc(ymdInTimeZone(cursor, timeZone), "00:00", timeZone);
  }
  return days;
}

export function generateSlotsFromBusy(input: {
  from: Date;
  to: Date;
  now: Date;
  busy: CalendarBusyInterval[];
  workingHours: WorkingHoursConfig;
  durationMinutes: number;
  slotIntervalMinutes: number;
  timeZone: string;
  maxSlots?: number;
}): CalendarSlot[] {
  const {
    from,
    to,
    now,
    busy,
    workingHours,
    durationMinutes,
    slotIntervalMinutes,
    timeZone,
    maxSlots = 24,
  } = input;

  const days = eachYmdInRange(from, to, timeZone);
  const slots: CalendarSlot[] = [];

  for (const ymd of days) {
    const sample = zonedWallClockToUtc(ymd, workingHours.start, timeZone);
    const weekday = weekdayInTimeZone(sample, timeZone);
    if (!workingHours.days.includes(weekday)) continue;

    let start = zonedWallClockToUtc(ymd, workingHours.start, timeZone);
    const dayEnd = zonedWallClockToUtc(ymd, workingHours.end, timeZone);

    while (addMinutes(start, durationMinutes).getTime() <= dayEnd.getTime()) {
      const end = addMinutes(start, durationMinutes);
      if (start >= from && end <= to && start >= now) {
        const taken = busy.some((block) =>
          intervalsOverlap(start, end, block.start, block.end),
        );
        if (!taken) {
          slots.push({ start, end });
          if (slots.length >= maxSlots) return slots;
        }
      }
      start = addMinutes(start, slotIntervalMinutes);
    }
  }

  return slots;
}

export function slotIsFree(
  start: Date,
  end: Date,
  busy: CalendarBusyInterval[],
): boolean {
  return !busy.some((block) => intervalsOverlap(start, end, block.start, block.end));
}
