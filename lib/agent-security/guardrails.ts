export type AgentGuardrailSettings = {
  stayOnTopic: boolean;
  refuseSensitive: boolean;
  escalateWhenUnsure: boolean;
};

export function buildGuardrailPromptSection(
  settings: AgentGuardrailSettings,
): string {
  const lines: string[] = [];

  if (settings.stayOnTopic) {
    lines.push(
      "Stay strictly on-topic for this business. If the customer asks about unrelated subjects, briefly decline and steer back to how you can help with this organization's products or services.",
    );
  }

  if (settings.refuseSensitive) {
    lines.push(
      "Do not provide medical diagnoses, legal advice, or personalized financial advice. Direct the customer to a qualified professional or offer to transfer to a human agent.",
    );
  }

  if (settings.escalateWhenUnsure) {
    lines.push(
      "If you are not confident in an answer, do not guess. Say you are unsure and offer to transfer to a human agent.",
    );
  }

  if (lines.length === 0) return "";
  return ["## Safety guardrails", ...lines].join("\n");
}
