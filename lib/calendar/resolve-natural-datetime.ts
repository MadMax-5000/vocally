import { formatInTimeZone } from "@/lib/calendar/slots";

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const FRENCH_HOUR = /^(\d{1,2})h(?:([0-5]\d))?(?:\s*matin)?$/i;

function addCivilDays(ymd: string, days: number): string {
  const match = YMD.exec(ymd);
  if (!match) return ymd;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = String(next.getUTCFullYear()).padStart(4, "0");
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolveNaturalDate(
  value: string,
  timeZone: string,
  now: Date = new Date(),
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (YMD.test(trimmed)) return trimmed;

  const key = trimmed.toLowerCase();
  const today = formatInTimeZone(now, timeZone).date;

  if (key === "today" || key === "aujourd'hui") return today;
  if (key === "tomorrow" || key === "demain") return addCivilDays(today, 1);

  return null;
}

export function resolveNaturalTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (HM.test(trimmed)) return trimmed;

  const key = trimmed.toLowerCase();
  if (key === "midi" || key === "noon") return "12:00";
  if (key === "minuit") return "00:00";

  const hourMatch = FRENCH_HOUR.exec(key);
  if (hourMatch) {
    const hour = Number(hourMatch[1]);
    if (hour > 23) return null;
    const minute = hourMatch[2] ? Number(hourMatch[2]) : 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return null;
}
