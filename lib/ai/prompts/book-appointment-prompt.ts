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
    "",
    "### Collect details quickly",
    "Required before booking: date, time, and customer name.",
    "Ask only for fields you do not already have — one short question at a time, never a checklist.",
    "If the customer already gave date and time in one message, confirm briefly in natural language and ask only for the missing piece (usually the name), then book.",
    "Do not re-ask for information the customer already provided.",
    "Do not ask for a department, specialty, or team unless the system instructions say to.",
    "",
    "### Dates and times",
    "Resolve relative and colloquial dates yourself using the Current date and time section: demain, aujourd'hui, lundi prochain, next Tuesday, 10h matin, 10am, etc.",
    "Convert internally to YYYY-MM-DD and HH:MM (24-hour) only when calling tools.",
    "Never ask the customer to type a date as YYYY-MM-DD or a time in 24-hour format.",
    "Confirm dates in natural language only (e.g. \"Demain à 10h, c'est bien ?\").",
  ];

  if (isExternalCalendarConfigured(action)) {
    lines.push(
      "A live calendar is connected. You MUST call list_available_slots before offering times.",
      "Only offer times returned by list_available_slots. Never invent a date or time.",
      "Offer 2–4 available times in the customer's language, then book the one they pick.",
      "Use the book_appointment tool with the exact date (YYYY-MM-DD) and time (HH:MM 24-hour) from the slot list, plus customer name.",
    );
    if (action.calendarProvider === "calendly") {
      lines.push("customerEmail is required before booking.");
    } else {
      lines.push("customerEmail and notes are optional but helpful for confirmations.");
    }
  } else {
    lines.push(
      "Use the book_appointment tool once you have date, time, and customer name.",
      "customerEmail and notes are optional but helpful for confirmations.",
    );
  }

  lines.push("After a successful booking, confirm the date and time clearly in natural language.");
  return lines.join("\n");
}
