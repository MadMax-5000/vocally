import { formatInTimeZone } from "@/lib/calendar/slots";
import { DEFAULT_APPOINTMENT_TIMEZONE } from "@/lib/deploy/book-appointment-action";

export function resolvePromptTimeZone(timeZone?: string | null): string {
  const trimmed = timeZone?.trim();
  return trimmed || DEFAULT_APPOINTMENT_TIMEZONE;
}

export function buildDateTimeContextSection(
  timeZone: string,
  now: Date = new Date(),
): string {
  const zone = resolvePromptTimeZone(timeZone);
  const { date, time } = formatInTimeZone(now, zone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  return [
    "## Current date and time",
    `Today is ${weekday} (${date}) in ${zone}.`,
    `Current local time: ${time}.`,
    `This is the only source of truth for "today", "tomorrow", "demain", "lundi prochain", and similar relative dates.`,
    "Never invent or recall dates from memory.",
  ].join("\n");
}
