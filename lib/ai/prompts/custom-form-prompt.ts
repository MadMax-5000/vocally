import type { ResolvedCustomFormAction } from "@/lib/deploy/custom-form-action";

export function buildCustomFormPromptSection(
  action: ResolvedCustomFormAction,
): string {
  const fieldSummary = action.fields
    .map((f) => `${f.label} (${f.type}${f.required ? ", required" : ""})`)
    .join(", ");

  return [
    "## Custom form",
    `A structured form titled "${action.title}" is available with fields: ${fieldSummary}.`,
    "When you need several pieces of structured information at once, call the show_custom_form tool instead of collecting fields one-by-one in chat.",
    "After calling the tool, write a short friendly message introducing the form; the UI renders the fields below your message.",
    "Do not call show_custom_form if the customer already submitted this form in the current conversation.",
    "Do not duplicate form fields by asking for the same data in chat after showing the form unless the customer prefers typing instead.",
  ].join("\n");
}
