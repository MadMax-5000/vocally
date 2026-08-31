import type { CalendarProvider as PrismaCalendarProvider } from "@prisma/client";

import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

export type CalendarBusyInterval = {
  start: Date;
  end: Date;
};

export type CalendarSlot = {
  start: Date;
  end: Date;
};

export type BookCalendarSlotInput = {
  start: Date;
  customerName: string;
  customerEmail?: string | null;
  notes?: string | null;
};

export type BookCalendarSlotResult = {
  eventId: string;
  htmlLink?: string;
};

export type ListCalendarSlotsInput = {
  from: Date;
  to: Date;
  now?: Date;
};

export type CalendarClient = {
  listSlots(input: ListCalendarSlotsInput): Promise<CalendarSlot[]>;
  bookSlot(input: BookCalendarSlotInput): Promise<BookCalendarSlotResult>;
};

export type CalendarConnectionRecord = {
  id: string;
  orgId: string;
  agentId: string;
  provider: PrismaCalendarProvider;
  refreshTokenEnc: string;
  accessTokenEnc: string | null;
  tokenExpiresAt: Date | null;
  accountEmail: string | null;
  calendarId: string | null;
  externalUserUri: string | null;
  externalOrgUri: string | null;
};

export type CalendarRuntime = {
  connection: CalendarConnectionRecord;
  action: ResolvedBookAppointmentAction;
};

export class CalendarSlotTakenError extends Error {
  constructor(message = "That time is no longer available.") {
    super(message);
    this.name = "CalendarSlotTakenError";
  }
}

export class CalendarNotConnectedError extends Error {
  constructor(message = "No calendar is connected for this agent.") {
    super(message);
    this.name = "CalendarNotConnectedError";
  }
}

export class CalendlyPaidPlanError extends Error {
  constructor(
    message = "Calendly booking via API requires a paid Calendly plan (Standard or higher).",
  ) {
    super(message);
    this.name = "CalendlyPaidPlanError";
  }
}
