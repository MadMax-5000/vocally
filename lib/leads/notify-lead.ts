import type { Channel } from "@prisma/client";

import { sendEmail } from "@/lib/email/send";
import { logServerWarning } from "@/lib/logger";

export async function notifyLeadCaptured(input: {
  notifyEmail: string;
  subject: string;
  lines: string[];
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await sendEmail({
      to: input.notifyEmail,
      subject: input.subject,
      body: input.lines.join("\n"),
    });
  } catch {
    logServerWarning("lead_notify_email_failed", {
      subjectLength: input.subject.length,
    });
  }
}

export function formatCollectLeadEmailLines(input: {
  agentName: string;
  channel: Channel;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
}): string[] {
  const lines = [
    `A complete lead was captured for agent "${input.agentName}".`,
    `Channel: ${input.channel}`,
  ];
  if (input.name?.trim()) lines.push(`Name: ${input.name.trim()}`);
  if (input.email?.trim()) lines.push(`Email: ${input.email.trim()}`);
  if (input.phone?.trim()) lines.push(`Phone: ${input.phone.trim()}`);
  if (input.company?.trim()) lines.push(`Company: ${input.company.trim()}`);
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`);
  return lines;
}

export function formatCustomFormEmailLines(input: {
  agentName: string;
  formTitle: string;
  detail: Record<string, string>;
}): string[] {
  const lines = [
    `A custom form was submitted for agent "${input.agentName}".`,
    `Form: ${input.formTitle}`,
  ];
  for (const [label, value] of Object.entries(input.detail)) {
    if (value.trim()) lines.push(`${label}: ${value.trim()}`);
  }
  return lines;
}

export function formatAppointmentEmailLines(input: {
  agentName: string;
  customerName: string;
  customerEmail: string | null;
  department: string;
  date: string;
  time: string;
  notes: string | null;
}): string[] {
  const lines = [
    `A new appointment was booked for agent "${input.agentName}".`,
    `Customer: ${input.customerName}`,
    `Department: ${input.department}`,
    `Date: ${input.date}`,
    `Time: ${input.time}`,
  ];
  if (input.customerEmail?.trim()) {
    lines.push(`Email: ${input.customerEmail.trim()}`);
  }
  if (input.notes?.trim()) {
    lines.push(`Notes: ${input.notes.trim()}`);
  }
  return lines;
}
