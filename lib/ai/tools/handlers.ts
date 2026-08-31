import type { ToolContext } from "./types";
import {
  formatAppointmentEmailLines,
  notifyLeadCaptured,
} from "@/lib/leads/notify-lead";
import {
  bookExternalSlot,
  isExternalCalendarActive,
} from "@/lib/calendar/service";
import { parseHhMm, zonedWallClockToUtc } from "@/lib/calendar/slots";
import {
  CalendlyPaidPlanError,
  CalendarNotConnectedError,
  CalendarSlotTakenError,
} from "@/lib/calendar/types";

function getMockOrder(orderId: string): string {
  const mockOrders: Record<string, unknown> = {
    "ORD-12345": {
      id: "ORD-12345",
      status: "out_for_delivery",
      estimatedDelivery: "2026-05-15",
      carrier: "FedEx",
      tracking: "FX1234567890",
      items: [{ name: "Wireless Headphones", qty: 1, price: 89.99 }],
      total: 89.99,
    },
    "ORD-12346": {
      id: "ORD-12346",
      status: "shipped",
      estimatedDelivery: "2026-05-18",
      carrier: "UPS",
      tracking: "1Z999AA10123456784",
      items: [
        { name: "Laptop Stand", qty: 1, price: 49.99 },
        { name: "USB-C Hub", qty: 2, price: 34.99 },
      ],
      total: 119.97,
    },
    "ORD-12347": {
      id: "ORD-12347",
      status: "processing",
      estimatedDelivery: "2026-05-22",
      carrier: "USPS",
      tracking: null,
      items: [{ name: "Desk Lamp", qty: 1, price: 39.99 }],
      total: 39.99,
    },
  };

  const order = mockOrders[orderId] ?? { id: orderId, status: "not_found" };
  return JSON.stringify(order);
}

function getMockAccount(accountId?: string, email?: string): string {
  const mockAccounts: Record<string, unknown> = {
    "ACC-98765": {
      accountId: "ACC-98765",
      name: "Ahmed Benali",
      email: "ahmed.benali@example.com",
      plan: "PRO",
      status: "active",
      memberSince: "2025-09-01",
      phone: "+212 6XX-XXXXXX",
    },
    "ACC-98766": {
      accountId: "ACC-98766",
      name: "Fatima Zahra",
      email: "fatima.z@example.com",
      plan: "STARTER",
      status: "active",
      memberSince: "2026-01-15",
      phone: "+212 6XX-XXXXXX",
    },
  };

  if (accountId && mockAccounts[accountId]) {
    return JSON.stringify(mockAccounts[accountId]);
  }

  if (email) {
    const found = Object.values(mockAccounts).find(
      (a) => (a as { email: string }).email === email,
    );
    if (found) return JSON.stringify(found);
  }

  return JSON.stringify({ error: "Account not found", accountId, email });
}

export async function handleCheckOrderStatus(
  args: Record<string, unknown>,
  _ctx: ToolContext,
): Promise<string> {
  const orderId = String(args.orderId ?? "");
  if (!orderId) {
    return JSON.stringify({ error: "Order ID is required" });
  }
  return getMockOrder(orderId);
}

export async function handleBookAppointment(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const action = ctx.bookAppointment;
  if (!action?.enabled) {
    return JSON.stringify({
      error: "Appointment booking is not enabled for this agent.",
    });
  }

  const customerName = String(args.customerName ?? "").trim();
  if (!customerName) {
    return JSON.stringify({ error: "Customer name is required." });
  }

  const dateStr = String(args.date ?? "").trim();
  const timeStr = String(args.time ?? "").trim();
  if (!dateStr || !timeStr) {
    return JSON.stringify({ error: "Date and time are required." });
  }

  const parsedTime = parseHhMm(timeStr);
  if (!parsedTime) {
    return JSON.stringify({ error: "Invalid time format. Use HH:MM (24-hour)." });
  }

  const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  const customerEmail = args.customerEmail ? String(args.customerEmail).trim() : null;
  const notes = args.notes ? String(args.notes).trim() : null;
  const usesExternalCalendar = isExternalCalendarActive(
    action,
    ctx.calendarConnection ?? null,
  );

  if (
    action.calendarProvider === "google" ||
    action.calendarProvider === "calendly"
  ) {
    if (!usesExternalCalendar) {
      return JSON.stringify({
        error:
          action.calendarProvider === "calendly" && !action.eventTypeUri
            ? "Select a Calendly event type in the dashboard before booking."
            : "Calendar is not connected. Connect Google Calendar or Calendly, then try again.",
      });
    }
    if (action.calendarProvider === "calendly" && !customerEmail) {
      return JSON.stringify({
        error: "Customer email is required to book on Calendly.",
      });
    }
  }

  let start: Date;
  try {
    start = zonedWallClockToUtc(dateStr, timeStr, action.timezone);
  } catch {
    return JSON.stringify({ error: "Invalid date or time for the clinic timezone." });
  }

  let externalProvider: "GOOGLE" | "CALENDLY" | null = null;
  let externalEventId: string | null = null;

  if (usesExternalCalendar && ctx.calendarConnection) {
    try {
      const booked = await bookExternalSlot(action, ctx.calendarConnection, {
        start,
        customerName,
        customerEmail,
        notes,
      });
      externalEventId = booked.eventId;
      externalProvider = ctx.calendarConnection.provider;
    } catch (err) {
      if (err instanceof CalendarSlotTakenError) {
        return JSON.stringify({
          error: "That time is no longer available. Call list_available_slots and offer another time.",
        });
      }
      if (err instanceof CalendlyPaidPlanError || err instanceof CalendarNotConnectedError) {
        return JSON.stringify({ error: err.message });
      }
      return JSON.stringify({
        error: err instanceof Error ? err.message : "Could not book the calendar event.",
      });
    }
  }

  const { prisma } = await import("@/lib/db/prisma");

  const appointment = await prisma.appointment.create({
    data: {
      orgId: ctx.orgId,
      sessionId: ctx.sessionId,
      customerName,
      customerEmail,
      department: null,
      date: parsedDate,
      time: timeStr,
      durationMinutes: usesExternalCalendar ? action.durationMinutes : null,
      notes,
      externalProvider,
      externalEventId,
    },
  });

  if (action.notifyEmail) {
    let agentName = "Agent";
    if (ctx.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: ctx.agentId, orgId: ctx.orgId },
        select: { name: true },
      });
      if (agent?.name) agentName = agent.name;
    }

    await notifyLeadCaptured({
      notifyEmail: action.notifyEmail,
      subject: `New appointment booked — ${customerName}`,
      lines: formatAppointmentEmailLines({
        agentName,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        department: appointment.department,
        date: dateStr,
        time: appointment.time,
        notes: appointment.notes,
      }),
    });
  }

  return JSON.stringify({
    success: true,
    appointmentId: appointment.id,
    customerName: appointment.customerName,
    date: dateStr,
    time: timeStr,
    status: "confirmed",
    message: `Appointment confirmed for ${dateStr} at ${timeStr}.`,
  });
}

export async function handleCreateTicket(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { prisma } = await import("@/lib/db/prisma");

  const ticket = await prisma.ticket.create({
    data: {
      orgId: ctx.orgId,
      sessionId: ctx.sessionId,
      subject: String(args.subject ?? ""),
      description: String(args.description ?? ""),
      priority: (String(args.priority ?? "medium").toUpperCase()) as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      customerEmail: args.customerEmail ? String(args.customerEmail) : null,
    },
  });

  return JSON.stringify({
    success: true,
    ticketId: ticket.id,
    subject: ticket.subject,
    priority: ticket.priority,
    status: "open",
    message: `Ticket #${ticket.id.substring(0, 8)} created with ${args.priority} priority. Our team will follow up.`,
  });
}

export async function handleLookupAccount(
  args: Record<string, unknown>,
  _ctx: ToolContext,
): Promise<string> {
  const accountId = args.accountId ? String(args.accountId) : undefined;
  const email = args.email ? String(args.email) : undefined;
  return getMockAccount(accountId, email);
}

export type DtmfRequest = {
  prompt: string;
  maxDigits: number;
  finishOnKey: string;
  description: string;
};

export const dtmfRequestStore = new Map<string, DtmfRequest>();

export async function handleRequestSecureInput(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const request: DtmfRequest = {
    prompt: String(args.prompt ?? ""),
    maxDigits: Number(args.maxDigits ?? 6),
    finishOnKey: String(args.finishOnKey ?? "#"),
    description: String(args.description ?? "secure input"),
  };
  dtmfRequestStore.set(ctx.sessionId, request);
  return JSON.stringify({ status: "awaiting_dtmf_input", prompt: args.prompt });
}
