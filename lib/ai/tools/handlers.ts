import type { ToolContext } from "./types";

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
  const { prisma } = await import("@/lib/db/prisma");

  const appointment = await prisma.appointment.create({
    data: {
      orgId: ctx.orgId,
      sessionId: ctx.sessionId,
      customerName: String(args.customerName ?? ""),
      customerEmail: args.customerEmail ? String(args.customerEmail) : null,
      department: String(args.department ?? "general"),
      date: new Date(String(args.date ?? "")),
      time: String(args.time ?? ""),
      notes: args.notes ? String(args.notes) : null,
    },
  });

  return JSON.stringify({
    success: true,
    appointmentId: appointment.id,
    customerName: appointment.customerName,
    date: args.date,
    time: args.time,
    department: args.department,
    status: "confirmed",
    message: `Appointment confirmed for ${args.date} at ${args.time} with ${args.department}.`,
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
