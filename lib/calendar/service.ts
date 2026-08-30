import type { CalendarProvider } from "@prisma/client";

import {
  isExternalCalendarConfigured,
  type ResolvedBookAppointmentAction,
} from "@/lib/deploy/book-appointment-action";

import { createCalendlyClient } from "./calendly/client";
import { createGoogleCalendarClient } from "./google/client";
import type {
  BookCalendarSlotInput,
  BookCalendarSlotResult,
  CalendarClient,
  CalendarConnectionRecord,
  CalendarSlot,
  ListCalendarSlotsInput,
} from "./types";
import { CalendarNotConnectedError } from "./types";

export function toCalendarConnectionRecord(row: {
  id: string;
  orgId: string;
  agentId: string;
  provider: CalendarProvider;
  refreshTokenEnc: string;
  accessTokenEnc: string | null;
  tokenExpiresAt: Date | null;
  accountEmail: string | null;
  calendarId: string | null;
  externalUserUri: string | null;
  externalOrgUri: string | null;
}): CalendarConnectionRecord {
  return {
    id: row.id,
    orgId: row.orgId,
    agentId: row.agentId,
    provider: row.provider,
    refreshTokenEnc: row.refreshTokenEnc,
    accessTokenEnc: row.accessTokenEnc,
    tokenExpiresAt: row.tokenExpiresAt,
    accountEmail: row.accountEmail,
    calendarId: row.calendarId,
    externalUserUri: row.externalUserUri,
    externalOrgUri: row.externalOrgUri,
  };
}

export function connectionMatchesAction(
  action: ResolvedBookAppointmentAction,
  connection: CalendarConnectionRecord | null | undefined,
): boolean {
  if (!connection) return false;
  if (action.calendarProvider === "google") return connection.provider === "GOOGLE";
  if (action.calendarProvider === "calendly") {
    return connection.provider === "CALENDLY" && Boolean(action.eventTypeUri);
  }
  return false;
}

export function isExternalCalendarActive(
  action: ResolvedBookAppointmentAction,
  connection: CalendarConnectionRecord | null | undefined,
): boolean {
  return isExternalCalendarConfigured(action) && connectionMatchesAction(action, connection);
}

export function createCalendarClient(
  action: ResolvedBookAppointmentAction,
  connection: CalendarConnectionRecord,
): CalendarClient {
  if (action.calendarProvider === "google" && connection.provider === "GOOGLE") {
    return createGoogleCalendarClient(connection, action);
  }
  if (action.calendarProvider === "calendly" && connection.provider === "CALENDLY") {
    return createCalendlyClient(connection, action);
  }
  throw new CalendarNotConnectedError();
}

export async function listExternalSlots(
  action: ResolvedBookAppointmentAction,
  connection: CalendarConnectionRecord,
  input: ListCalendarSlotsInput,
): Promise<CalendarSlot[]> {
  return createCalendarClient(action, connection).listSlots(input);
}

export async function bookExternalSlot(
  action: ResolvedBookAppointmentAction,
  connection: CalendarConnectionRecord,
  input: BookCalendarSlotInput,
): Promise<BookCalendarSlotResult> {
  return createCalendarClient(action, connection).bookSlot(input);
}

export async function loadCalendarConnection(
  agentId: string,
  orgId: string,
): Promise<CalendarConnectionRecord | null> {
  const { prisma } = await import("@/lib/db/prisma");
  const row = await prisma.calendarConnection.findFirst({
    where: { agentId, orgId },
  });
  return row ? toCalendarConnectionRecord(row) : null;
}
