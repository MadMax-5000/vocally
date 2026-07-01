import type { AgentChannel } from "@prisma/client";

import {
  parseCustomButtonActionConfig,
  type CustomButtonActionConfig,
} from "@/lib/deploy/custom-button-action";
import { parseEscalationActionConfig } from "@/lib/deploy/escalation-action";
import { parseCollectLeadsActionConfig } from "@/lib/deploy/collect-leads-action";
import { parseCustomFormActionConfig } from "@/lib/deploy/custom-form-action";
import {
  getWebChatChannel,
  parseWebChatConfig,
  type WebChatChannelConfig,
} from "@/lib/deploy/web-chat-config";

export type SuggestedMessagesActionConfig = {
  enabled?: boolean;
  staticStarters?: string[];
  keepShowingAfterFirst?: boolean;
  dynamicEnabled?: boolean;
};

export type ResolvedSuggestedMessagesAction = {
  enabled: boolean;
  staticStarters: string[];
  keepShowingAfterFirst: boolean;
  dynamicEnabled: boolean;
};

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  return items;
}

export function parseSuggestedMessagesActionConfig(
  value: unknown,
): SuggestedMessagesActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: SuggestedMessagesActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  const staticStarters = parseStringArray(raw.staticStarters);
  if (staticStarters !== undefined) {
    result.staticStarters = staticStarters;
  }
  if (typeof raw.keepShowingAfterFirst === "boolean") {
    result.keepShowingAfterFirst = raw.keepShowingAfterFirst;
  }
  if (typeof raw.dynamicEnabled === "boolean") {
    result.dynamicEnabled = raw.dynamicEnabled;
  }

  return result;
}

export function parseWebChatActionsConfig(
  actions: unknown,
): WebChatChannelConfig["actions"] {
  if (!actions || typeof actions !== "object" || Array.isArray(actions)) {
    return undefined;
  }
  const raw = actions as Record<string, unknown>;
  const suggested = raw.suggestedMessages;
  const customButtons = raw.customButtons;
  const escalations = raw.escalations;
  const collectLeads = raw.collectLeads;
  const customForm = raw.customForm;
  const result: NonNullable<WebChatChannelConfig["actions"]> = {};

  if (suggested) {
    result.suggestedMessages = parseSuggestedMessagesActionConfig(suggested);
  }
  if (customButtons) {
    result.customButtons = parseCustomButtonActionConfig(customButtons);
  }
  if (escalations) {
    result.escalations = parseEscalationActionConfig(escalations);
  }
  if (collectLeads) {
    result.collectLeads = parseCollectLeadsActionConfig(collectLeads);
  }
  if (customForm) {
    result.customForm = parseCustomFormActionConfig(customForm);
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export type { CustomButtonActionConfig };

export function resolveSuggestedMessagesAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedSuggestedMessagesAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.suggestedMessages ?? {};

  return {
    enabled: action.enabled ?? false,
    staticStarters: action.staticStarters ?? [],
    keepShowingAfterFirst: action.keepShowingAfterFirst ?? false,
    dynamicEnabled: action.dynamicEnabled ?? false,
  };
}

/** Chips shown on first paint before any chat messages. */
export function getInitialSuggestedMessages(
  action: ResolvedSuggestedMessagesAction,
): string[] {
  if (!action.enabled) return [];
  return action.staticStarters;
}

export function shouldShowSuggestedMessages(input: {
  hasMessages: boolean;
  keepShowingAfterFirst: boolean;
  suggestionCount: number;
}): boolean {
  if (input.suggestionCount === 0) return false;
  return !input.hasMessages || input.keepShowingAfterFirst;
}

export type MergeSuggestedMessagesInput = {
  action: ResolvedSuggestedMessagesAction;
  userMessageCount: number;
  dynamicSuggestions: string[];
};

/** Build API response chips after a bot reply. */
export function mergeSuggestedMessagesForResponse(
  input: MergeSuggestedMessagesInput,
): string[] {
  const { action, userMessageCount, dynamicSuggestions } = input;

  if (!action.enabled) return [];

  const staticStarters = action.staticStarters;
  const dynamic = dynamicSuggestions.filter((s) => s.trim());

  if (action.dynamicEnabled && dynamic.length > 0) {
    if (action.keepShowingAfterFirst && staticStarters.length > 0) {
      const seen = new Set<string>();
      const merged: string[] = [];
      for (const s of [...staticStarters, ...dynamic]) {
        const key = s.trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(key);
      }
      return merged;
    }
    return dynamic;
  }

  if (action.keepShowingAfterFirst && staticStarters.length > 0) {
    return staticStarters;
  }

  if (userMessageCount === 0 && staticStarters.length > 0) {
    return staticStarters;
  }

  return [];
}
