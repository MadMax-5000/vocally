import {
  isExternalCalendarActive,
  listExternalSlots,
} from "@/lib/calendar/service";
import { resolveNaturalDate } from "@/lib/calendar/resolve-natural-datetime";
import {
  addMinutes,
  formatInTimeZone,
  zonedWallClockToUtc,
} from "@/lib/calendar/slots";
import { CalendlyPaidPlanError, CalendarNotConnectedError } from "@/lib/calendar/types";
import type { ToolContext } from "../types";

function parseYmd(value: unknown, timeZone: string): string | null {
  if (typeof value !== "string") return null;
  return resolveNaturalDate(value, timeZone);
}

export async function handleListAvailableSlots(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const action = ctx.bookAppointment;
  if (!action?.enabled) {
    return JSON.stringify({ error: "Appointment booking is not enabled for this agent." });
  }
  if (!isExternalCalendarActive(action, ctx.calendarConnection ?? null)) {
    return JSON.stringify({
      error:
        "No external calendar is connected. Collect a preferred date and time, then use book_appointment.",
    });
  }

  const timeZone = action.timezone;
  const now = new Date();
  const fromDate = parseYmd(args.fromDate, timeZone);
  const toDate = parseYmd(args.toDate, timeZone);

  let from = now;
  if (fromDate) {
    const startOfDay = zonedWallClockToUtc(fromDate, "00:00", timeZone);
    from = startOfDay > now ? startOfDay : now;
  }

  const defaultTo = addMinutes(from, action.maxDaysAhead * 24 * 60);
  let to = defaultTo;
  if (toDate) {
    to = zonedWallClockToUtc(toDate, "23:59", timeZone);
  }
  if (to <= from) {
    return JSON.stringify({ error: "toDate must be after fromDate." });
  }

  try {
    const slots = await listExternalSlots(action, ctx.calendarConnection!, {
      from,
      to,
      now,
    });
    return JSON.stringify({
      success: true,
      timezone: timeZone,
      durationMinutes: action.durationMinutes,
      slots: slots.map((slot) => {
        const formatted = formatInTimeZone(slot.start, timeZone);
        return {
          date: formatted.date,
          time: formatted.time,
        };
      }),
    });
  } catch (err) {
    if (err instanceof CalendlyPaidPlanError || err instanceof CalendarNotConnectedError) {
      return JSON.stringify({ error: err.message });
    }
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Could not load available times.",
    });
  }
}
