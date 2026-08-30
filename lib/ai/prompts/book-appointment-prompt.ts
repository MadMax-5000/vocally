import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";
import { isExternalCalendarConfigured } from "@/lib/deploy/book-appointment-action";

export function buildBookAppointmentPromptSection(
  action: ResolvedBookAppointmentAction,
): string {
  const timing =
    action.whenToOffer === "proactive"
      ? "After your greeting, briefly mention that you can help schedule an appointment when relevant (do not push booking on every message)."
      : "Only offer to book an appointment when the customer asks to schedule, meet, visit, or book a call/demo/consultation.";

  const lines = [
    "## Appointment booking (enabled)",
    timing,
    `Available departments: ${action.departments.join(", ")}.`,
  ];

  if (isExternalCalendarConfigured(action)) {
    lines.push(
      "A live calendar is connected. You MUST call list_available_slots before offering times.",
      "Only offer times returned by list_available_slots. Never invent a date or time.",
      "Offer 2–4 available times in the customer's language, then book the one they pick.",
      "Use the book_appointment tool with the exact date (YYYY-MM-DD) and time (HH:MM 24-hour) from the slot list, plus department and customer name.",
    );
    if (action.calendarProvider === "calendly") {
      lines.push("customerEmail is required before booking.");
    } else {
      lines.push("customerEmail and notes are optional but helpful for confirmations.");
    }
  } else {
    lines.push(
      "Use the book_appointment tool once you have: date (YYYY-MM-DD), time (HH:MM 24-hour), department, and customer name.",
      "Ask for missing required details one or two at a time, conversationally.",
      "customerEmail and notes are optional but helpful for confirmations.",
    );
  }

  lines.push("After a successful booking, confirm the date, time, and department clearly.");
  return lines.join("\n");
}
