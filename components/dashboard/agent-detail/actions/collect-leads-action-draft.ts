import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  LEAD_FIELD_KEYS,
  resolveCollectLeadsAction,
  type CollectLeadsWhenToAsk,
  type LeadFieldKey,
  type LeadFieldRequirement,
} from "@/lib/deploy/collect-leads-action";

export type CollectLeadsActionDraft = {
  enabled: boolean;
  whenToAsk: CollectLeadsWhenToAsk;
  fields: Record<LeadFieldKey, LeadFieldRequirement>;
  consentText: string;
  notifyEmail: string;
};

export function buildCollectLeadsActionDraft(
  agent: AgentDetailWithRelations,
): CollectLeadsActionDraft {
  const resolved = resolveCollectLeadsAction(agent.channels);
  return {
    enabled: resolved.enabled,
    whenToAsk: resolved.whenToAsk,
    fields: { ...resolved.fields },
    consentText: resolved.consentText,
    notifyEmail: resolved.notifyEmail ?? "",
  };
}

export function draftsEqual(a: CollectLeadsActionDraft, b: CollectLeadsActionDraft): boolean {
  if (
    a.enabled !== b.enabled ||
    a.whenToAsk !== b.whenToAsk ||
    a.consentText !== b.consentText ||
    a.notifyEmail !== b.notifyEmail
  ) {
    return false;
  }
  return LEAD_FIELD_KEYS.every((key) => a.fields[key] === b.fields[key]);
}
