import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

import { addMinutes } from "../slots";
import type {
  BookCalendarSlotInput,
  BookCalendarSlotResult,
  CalendarClient,
  CalendarConnectionRecord,
  CalendarSlot,
  ListCalendarSlotsInput,
} from "../types";
import { CalendlyPaidPlanError, CalendarSlotTakenError } from "../types";
import {
  CALENDLY_API_BASE,
  decryptCalendlyToken,
  encryptCalendlyToken,
  refreshCalendlyAccessToken,
} from "./oauth";

type CalendlyUserMe = {
  resource?: {
    uri?: string;
    email?: string;
    current_organization?: string;
  };
};

type CalendlyEventType = {
  uri: string;
  name: string;
  active?: boolean;
  duration?: number;
};

type CalendlyEventTypesResponse = {
  collection?: CalendlyEventType[];
};

type CalendlyAvailableTime = {
  status?: string;
  start_time?: string;
  invitees_remaining?: number;
};

type CalendlyAvailableTimesResponse = {
  collection?: CalendlyAvailableTime[];
};

type CalendlyInviteeResponse = {
  resource?: {
    uri?: string;
    event?: string;
  };
  message?: string;
  title?: string;
};

async function calendlyFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${CALENDLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function getCalendlyUserMe(accessToken: string): Promise<{
  uri: string;
  email: string | null;
  organizationUri: string | null;
}> {
  const res = await calendlyFetch(accessToken, "/users/me");
  if (!res.ok) {
    throw new Error("Could not load Calendly user profile");
  }
  const json = (await res.json()) as CalendlyUserMe;
  const uri = json.resource?.uri;
  if (!uri) throw new Error("Calendly user uri missing");
  return {
    uri,
    email: json.resource?.email ?? null,
    organizationUri: json.resource?.current_organization ?? null,
  };
}

export async function getValidCalendlyAccessToken(
  connection: CalendarConnectionRecord,
): Promise<{ accessToken: string; connection: CalendarConnectionRecord }> {
  const now = Date.now();
  const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
  if (connection.accessTokenEnc && expiresAt > now + 60_000) {
    return {
      accessToken: decryptCalendlyToken(connection.accessTokenEnc),
      connection,
    };
  }

  const refreshToken = decryptCalendlyToken(connection.refreshTokenEnc);
  const refreshed = await refreshCalendlyAccessToken(refreshToken);
  const next: CalendarConnectionRecord = {
    ...connection,
    refreshTokenEnc: encryptCalendlyToken(refreshed.refreshToken),
    accessTokenEnc: encryptCalendlyToken(refreshed.accessToken),
    tokenExpiresAt: refreshed.expiresAt,
  };

  const { prisma } = await import("@/lib/db/prisma");
  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      refreshTokenEnc: next.refreshTokenEnc,
      accessTokenEnc: next.accessTokenEnc,
      tokenExpiresAt: next.tokenExpiresAt,
    },
  });

  return { accessToken: refreshed.accessToken, connection: next };
}

export async function listCalendlyEventTypes(
  connection: CalendarConnectionRecord,
): Promise<{ uri: string; name: string; duration: number | null }[]> {
  const { accessToken } = await getValidCalendlyAccessToken(connection);
  const userUri = connection.externalUserUri;
  if (!userUri) throw new Error("Calendly user is not connected");

  const params = new URLSearchParams({
    user: userUri,
    active: "true",
    count: "50",
  });
  const res = await calendlyFetch(accessToken, `/event_types?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Could not load Calendly event types");
  }
  const json = (await res.json()) as CalendlyEventTypesResponse;
  return (json.collection ?? []).map((item) => ({
    uri: item.uri,
    name: item.name,
    duration: typeof item.duration === "number" ? item.duration : null,
  }));
}

function throwIfPaidPlanRequired(res: Response, body: unknown): void {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const message = [record.message, record.title, record.error]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
  if (
    res.status === 403 ||
    /paid plan|upgrade|standard or higher|permission/i.test(message)
  ) {
    throw new CalendlyPaidPlanError();
  }
}

export function createCalendlyClient(
  connection: CalendarConnectionRecord,
  action: ResolvedBookAppointmentAction,
): CalendarClient {
  return {
    async listSlots(input: ListCalendarSlotsInput): Promise<CalendarSlot[]> {
      const eventTypeUri = action.eventTypeUri;
      if (!eventTypeUri) {
        throw new Error("Select a Calendly event type before listing slots.");
      }
      const { accessToken } = await getValidCalendlyAccessToken(connection);
      const params = new URLSearchParams({
        event_type: eventTypeUri,
        start_time: input.from.toISOString(),
        end_time: input.to.toISOString(),
      });
      const res = await calendlyFetch(
        accessToken,
        `/event_type_available_times?${params.toString()}`,
      );
      const json = (await res.json()) as CalendlyAvailableTimesResponse & Record<string, unknown>;
      if (!res.ok) {
        throwIfPaidPlanRequired(res, json);
        throw new Error("Could not load Calendly availability.");
      }
      const duration = action.durationMinutes;
      return (json.collection ?? [])
        .filter((item) => item.status === "available" && item.start_time)
        .map((item) => {
          const start = new Date(item.start_time as string);
          return { start, end: addMinutes(start, duration) };
        })
        .filter((slot) => slot.start >= (input.now ?? new Date()))
        .slice(0, 12);
    },

    async bookSlot(input: BookCalendarSlotInput): Promise<BookCalendarSlotResult> {
      const eventTypeUri = action.eventTypeUri;
      if (!eventTypeUri) {
        throw new Error("Select a Calendly event type before booking.");
      }
      const email = input.customerEmail?.trim();
      if (!email) {
        throw new Error("Customer email is required to book on Calendly.");
      }
      const { accessToken } = await getValidCalendlyAccessToken(connection);
      const res = await calendlyFetch(accessToken, "/invitees", {
        method: "POST",
        body: JSON.stringify({
          event_type: eventTypeUri,
          start_time: input.start.toISOString(),
          invitee: {
            name: input.customerName,
            email,
            timezone: action.timezone,
          },
        }),
      });
      const json = (await res.json()) as CalendlyInviteeResponse & Record<string, unknown>;
      if (!res.ok) {
        throwIfPaidPlanRequired(res, json);
        if (res.status === 400 || res.status === 404 || res.status === 409) {
          throw new CalendarSlotTakenError();
        }
        throw new Error(
          typeof json.message === "string" ? json.message : "Calendly booking failed.",
        );
      }
      const eventId = json.resource?.uri ?? json.resource?.event;
      if (!eventId) {
        throw new Error("Calendly did not return an invitee id.");
      }
      return { eventId };
    },
  };
}
