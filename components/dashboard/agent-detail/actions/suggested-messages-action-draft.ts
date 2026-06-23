import type { AgentDetailWithRelations } from "@/components/dashboard/agent-detail/agent-detail-types";
import {
  resolveDeploymentStaticStarters,
  resolveSuggestedMessagesAction,
} from "@/lib/deploy/suggested-messages-action";

export type SuggestedMessagesActionDraft = {
  enabled: boolean;
  staticStarters: string[];
  keepShowingAfterFirst: boolean;
  dynamicEnabled: boolean;
};

export function buildSuggestedMessagesActionDraft(
  agent: AgentDetailWithRelations,
): SuggestedMessagesActionDraft {
  const resolved = resolveSuggestedMessagesAction(agent.channels);
  const widgetStatic = resolveDeploymentStaticStarters(agent.channels, "widget");

  const staticStarters =
    resolved.staticStarters.length > 0
      ? [...resolved.staticStarters]
      : widgetStatic.length > 0
        ? [...widgetStatic]
        : [];

  return {
    enabled: resolved.enabled,
    staticStarters,
    keepShowingAfterFirst: resolved.keepShowingAfterFirst,
    dynamicEnabled: resolved.dynamicEnabled,
  };
}

export function draftsEqual(
  a: SuggestedMessagesActionDraft,
  b: SuggestedMessagesActionDraft,
): boolean {
  return (
    a.enabled === b.enabled &&
    a.keepShowingAfterFirst === b.keepShowingAfterFirst &&
    a.dynamicEnabled === b.dynamicEnabled &&
    a.staticStarters.length === b.staticStarters.length &&
    a.staticStarters.every((s, i) => s === b.staticStarters[i])
  );
}
