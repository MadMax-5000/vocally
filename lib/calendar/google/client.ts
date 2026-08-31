import { google } from "googleapis";

import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

import { generateSlotsFromBusy, slotIsFree, addMinutes } from "../slots";
import type {
  BookCalendarSlotInput,
  BookCalendarSlotResult,
  CalendarBusyInterval,
  CalendarClient,
  CalendarConnectionRecord,
  ListCalendarSlotsInput,
} from "../types";
import { CalendarSlotTakenError } from "../types";
import { createGoogleCalendarOAuthClient, decryptCalendarToken } from "./oauth";

function calendarAuth(connection: CalendarConnectionRecord) {
  const refreshToken = decryptCalendarToken(connection.refreshTokenEnc);
  const auth = createGoogleCalendarOAuthClient(refreshToken);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth });
}

function calendarIdOf(connection: CalendarConnectionRecord): string {
  return connection.calendarId?.trim() || "primary";
}

async function queryBusy(
  connection: CalendarConnectionRecord,
  from: Date,
  to: Date,
  timeZone: string,
): Promise<CalendarBusyInterval[]> {
  const calendar = calendarAuth(connection);
  const id = calendarIdOf(connection);
  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone,
      items: [{ id }],
    },
  });
  const busy = result.data.calendars?.[id]?.busy ?? [];
  return busy
    .filter((block) => block.start && block.end)
    .map((block) => ({
      start: new Date(block.start as string),
      end: new Date(block.end as string),
    }));
}

export function createGoogleCalendarClient(
  connection: CalendarConnectionRecord,
  action: ResolvedBookAppointmentAction,
): CalendarClient {
  return {
    async listSlots(input: ListCalendarSlotsInput) {
      const busy = await queryBusy(
        connection,
        input.from,
        input.to,
        action.timezone,
      );
      return generateSlotsFromBusy({
        from: input.from,
        to: input.to,
        now: input.now ?? new Date(),
        busy,
        workingHours: action.workingHours,
        durationMinutes: action.durationMinutes,
        slotIntervalMinutes: action.slotIntervalMinutes,
        timeZone: action.timezone,
        maxSlots: 12,
      });
    },

    async bookSlot(input: BookCalendarSlotInput): Promise<BookCalendarSlotResult> {
      const end = addMinutes(input.start, action.durationMinutes);
      const busy = await queryBusy(
        connection,
        input.start,
        end,
        action.timezone,
      );
      if (!slotIsFree(input.start, end, busy)) {
        throw new CalendarSlotTakenError();
      }

      const calendar = calendarAuth(connection);
      const id = calendarIdOf(connection);
      const email = input.customerEmail?.trim();
      const created = await calendar.events.insert({
        calendarId: id,
        sendUpdates: email ? "all" : "none",
        requestBody: {
          summary: input.customerName,
          description: input.notes?.trim() || undefined,
          start: {
            dateTime: input.start.toISOString(),
            timeZone: action.timezone,
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: action.timezone,
          },
          attendees: email ? [{ email }] : undefined,
        },
      });

      const eventId = created.data.id;
      if (!eventId) {
        throw new Error("Google Calendar did not return an event id.");
      }
      return {
        eventId,
        htmlLink: created.data.htmlLink ?? undefined,
      };
    },
  };
}

export async function listGoogleCalendarsForConnection(
  connection: CalendarConnectionRecord,
): Promise<{ id: string; summary: string; primary: boolean }[]> {
  const calendar = calendarAuth(connection);
  const result = await calendar.calendarList.list({ minAccessRole: "writer" });
  return (result.data.items ?? [])
    .filter((item): item is typeof item & { id: string } => Boolean(item.id))
    .map((item) => ({
      id: item.id,
      summary: item.summary ?? item.id,
      primary: item.primary === true,
    }));
}
