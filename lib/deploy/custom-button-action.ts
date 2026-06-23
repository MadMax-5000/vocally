import type { AgentChannel } from "@prisma/client";

import {
  getWebChatChannel,
  parseWebChatConfig,
} from "@/lib/deploy/web-chat-config";

export const MAX_CUSTOM_BUTTONS = 8;
export const MAX_CUSTOM_BUTTON_LABEL = 80;
export const MAX_CUSTOM_BUTTON_MESSAGE = 200;

export type CustomButtonKind = "link" | "message";

export type CustomButtonItem = {
  label: string;
  kind: CustomButtonKind;
  href?: string;
  message?: string;
  openInNewTab?: boolean;
};

export type CustomButtonActionConfig = {
  enabled?: boolean;
  buttons?: CustomButtonItem[];
};

export type ResolvedCustomButtonAction = {
  enabled: boolean;
  buttons: CustomButtonItem[];
};

function isHttpsUrl(href: string): boolean {
  return href.startsWith("https://");
}

function parseKind(value: unknown): CustomButtonKind | undefined {
  if (value === "link" || value === "message") return value;
  if (value === "url") return "link";
  return undefined;
}

function parseButtonItem(value: unknown): CustomButtonItem | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const kind = parseKind(raw.kind ?? raw.type);
  if (!label || !kind) return undefined;

  if (kind === "message") {
    const message =
      typeof raw.message === "string" ? raw.message.trim() : "";
    if (!message || message.length > MAX_CUSTOM_BUTTON_MESSAGE) return undefined;
    return { label: label.slice(0, MAX_CUSTOM_BUTTON_LABEL), kind, message };
  }

  const href = typeof raw.href === "string" ? raw.href.trim() : "";
  if (!href || !isHttpsUrl(href) || href.length > 2048) return undefined;
  const openInNewTab =
    typeof raw.openInNewTab === "boolean" ? raw.openInNewTab : true;
  return {
    label: label.slice(0, MAX_CUSTOM_BUTTON_LABEL),
    kind,
    href,
    openInNewTab,
  };
}

export function parseCustomButtonActionConfig(
  value: unknown,
): CustomButtonActionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const result: CustomButtonActionConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }

  if (Array.isArray(raw.buttons)) {
    const buttons: CustomButtonItem[] = [];
    for (const item of raw.buttons.slice(0, MAX_CUSTOM_BUTTONS)) {
      const parsed = parseButtonItem(item);
      if (parsed) buttons.push(parsed);
    }
    if (buttons.length > 0) {
      result.buttons = buttons;
    }
  }

  return result;
}

export function resolveCustomButtonAction(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedCustomButtonAction {
  const row = getWebChatChannel(channels);
  const parsed = row ? parseWebChatConfig(row.config) : {};
  const action = parsed.actions?.customButtons ?? {};

  return {
    enabled: action.enabled ?? false,
    buttons: action.buttons ?? [],
  };
}

export function getVisibleCustomButtons(
  action: ResolvedCustomButtonAction,
): CustomButtonItem[] {
  if (!action.enabled) return [];
  return action.buttons.filter((b) => {
    if (!b.label.trim()) return false;
    if (b.kind === "message") return Boolean(b.message?.trim());
    if (b.kind === "link") return Boolean(b.href?.trim() && isHttpsUrl(b.href));
    return false;
  });
}
