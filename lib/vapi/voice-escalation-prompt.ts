import { buildTriggerLabels, EscalationTrigger } from "@/lib/ai/escalation-service";
import type { EscalationTriggersConfig } from "@/lib/deploy/escalation-action";
import { resolveEscalationTriggers } from "@/lib/deploy/escalation-action";

export function buildVoiceEscalationPromptSection(
  triggers: EscalationTriggersConfig,
  handoffAvailable: boolean,
): string {
  const enabled = resolveEscalationTriggers(triggers);
  const labels = buildTriggerLabels();

  const lines = enabled.map((trigger) => {
    switch (trigger) {
      case EscalationTrigger.USER_REQUESTED:
        return "- Customer asks to speak to a human, agent, or representative.";
      case EscalationTrigger.NEGATIVE_SENTIMENT:
        return "- Customer sounds angry, frustrated, or upset.";
      case EscalationTrigger.AI_FAILURE:
        return "- You cannot answer after multiple attempts or encounter a system error.";
      case EscalationTrigger.UNSUPPORTED_REQUEST:
        return "- The request is outside your capabilities.";
      default:
        return `- ${labels[trigger] ?? trigger}`;
    }
  });

  if (lines.length === 0) {
    return "";
  }

  if (handoffAvailable) {
    return [
      "Escalation rules — call transfer_to_human immediately when:",
      ...lines,
      "Before transferring, briefly acknowledge the caller in one short sentence, then use transfer_to_human with a clear reason.",
    ].join("\n");
  }

  return [
    "Escalation rules — when any of these apply, apologize and offer a callback. Human transfer is not available on this line:",
    ...lines,
  ].join("\n");
}
