import type { ResolvedBookAppointmentAction } from "@/lib/deploy/book-appointment-action";

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
    "Use the book_appointment tool once you have: date (YYYY-MM-DD), time (HH:MM 24-hour), department, and customer name.",
    "Ask for missing required details one or two at a time, conversationally.",
    "customerEmail and notes are optional but helpful for confirmations.",
    "After a successful booking, confirm the date, time, and department clearly.",
  ];

  return lines.join("\n");
}
