import {
  getOptionalLeadFields,
  getRequiredLeadFields,
  LEAD_FIELD_KEYS,
  type ResolvedCollectLeadsAction,
} from "@/lib/deploy/collect-leads-action";

export function buildCollectLeadsPromptSection(
  action: ResolvedCollectLeadsAction,
): string {
  const required = getRequiredLeadFields(action);
  const optional = getOptionalLeadFields(action);
  const offFields = LEAD_FIELD_KEYS.filter((k) => action.fields[k] === "off");

  const timing =
    action.whenToAsk === "proactive"
      ? "After your greeting, naturally offer to capture contact details for follow-up (do not wait for explicit buying intent)."
      : "Only start collecting contact details when the customer shows buying intent (pricing, demo, quote, contact sales, partnership, etc.). Do not ask on generic FAQ or support questions.";

  const lines = [
    "## Lead collection (enabled)",
    timing,
    `Required fields: ${required.length > 0 ? required.join(", ") : "none"}.`,
    `Optional fields: ${optional.length > 0 ? optional.join(", ") : "none"}.`,
    `Do not ask for: ${offFields.length > 0 ? offFields.join(", ") : "none"}.`,
    `When collecting personal data, share this consent/disclaimer verbatim: "${action.consentText}"`,
    "Use the save_lead tool whenever you receive new lead information (you may call it multiple times with partial data).",
    "After save_lead returns missingRequired, ask only for those fields—one or two at a time, conversationally.",
    "Never ask for passwords, full credit card numbers, or CVV.",
  ];

  return lines.join("\n");
}
