import type { AgentChannel, AgentChannelType } from "@prisma/client";

import type { DeployCatalogEntry } from "@/lib/constants/deploy-catalog";

export const WIDGET_PRIMARY_COLOR_DEFAULT = "#FF5A36";
export const WIDGET_PLACEHOLDER_DEFAULT = "Message...";
export const WIDGET_POPUP_DELAY_DEFAULT = 3;

export type WebChatWidgetAppearance = "light" | "dark";

export type WebChatWidgetConfig = {
  displayName?: string;
  useMobileWelcome?: boolean;
  welcomeMessageMobile?: string;
  autoShowWelcomePopup?: boolean;
  welcomePopupDelaySec?: number;
  autoShowWelcomePopupMobile?: boolean;
  suggestedMessages?: string[];
  keepShowingSuggested?: boolean;
  placeholder?: string;
  voiceToTextEnabled?: boolean;
  attachmentsEnabled?: boolean;
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  bubbleColor?: string;
};

export type WebChatChannelConfig = {
  helpPage?: { enabled?: boolean };
  integrations?: Record<string, { enabled?: boolean }>;
  widget?: WebChatWidgetConfig;
};

function parseHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  return undefined;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : [];
}

export function parseWebChatWidgetConfig(config: unknown): WebChatWidgetConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }
  const raw = config as Record<string, unknown>;
  const result: WebChatWidgetConfig = {};

  if (typeof raw.displayName === "string") {
    result.displayName = raw.displayName.trim() || undefined;
  }
  if (typeof raw.useMobileWelcome === "boolean") {
    result.useMobileWelcome = raw.useMobileWelcome;
  }
  if (typeof raw.welcomeMessageMobile === "string") {
    result.welcomeMessageMobile = raw.welcomeMessageMobile.trim() || undefined;
  }
  if (typeof raw.autoShowWelcomePopup === "boolean") {
    result.autoShowWelcomePopup = raw.autoShowWelcomePopup;
  }
  if (typeof raw.welcomePopupDelaySec === "number" && Number.isFinite(raw.welcomePopupDelaySec)) {
    result.welcomePopupDelaySec = Math.min(60, Math.max(1, Math.round(raw.welcomePopupDelaySec)));
  }
  if (typeof raw.autoShowWelcomePopupMobile === "boolean") {
    result.autoShowWelcomePopupMobile = raw.autoShowWelcomePopupMobile;
  }
  const suggested = parseStringArray(raw.suggestedMessages);
  if (suggested !== undefined) result.suggestedMessages = suggested;
  if (typeof raw.keepShowingSuggested === "boolean") {
    result.keepShowingSuggested = raw.keepShowingSuggested;
  }
  if (typeof raw.placeholder === "string") {
    result.placeholder = raw.placeholder.trim() || undefined;
  }
  if (typeof raw.voiceToTextEnabled === "boolean") {
    result.voiceToTextEnabled = raw.voiceToTextEnabled;
  }
  if (typeof raw.attachmentsEnabled === "boolean") {
    result.attachmentsEnabled = raw.attachmentsEnabled;
  }
  if (raw.appearance === "light" || raw.appearance === "dark") {
    result.appearance = raw.appearance;
  }
  const primary = parseHexColor(raw.primaryColor);
  if (primary) result.primaryColor = primary;
  const bubble = parseHexColor(raw.bubbleColor);
  if (bubble) result.bubbleColor = bubble;

  return result;
}

export function parseWebChatConfig(config: unknown): WebChatChannelConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }
  const raw = config as Record<string, unknown>;

  const result: WebChatChannelConfig = {};

  const helpPage = raw.helpPage;
  if (helpPage && typeof helpPage === "object" && !Array.isArray(helpPage)) {
    const hp = helpPage as Record<string, unknown>;
    result.helpPage = {
      enabled: typeof hp.enabled === "boolean" ? hp.enabled : undefined,
    };
  }

  const integrations = raw.integrations;
  if (
    integrations &&
    typeof integrations === "object" &&
    !Array.isArray(integrations)
  ) {
    const parsed: Record<string, { enabled?: boolean }> = {};
    for (const [key, value] of Object.entries(integrations)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const v = value as Record<string, unknown>;
        parsed[key] = {
          enabled: typeof v.enabled === "boolean" ? v.enabled : undefined,
        };
      }
    }
    result.integrations = parsed;
  }

  const widget = raw.widget;
  if (widget && typeof widget === "object" && !Array.isArray(widget)) {
    result.widget = parseWebChatWidgetConfig(widget);
  }

  return result;
}

export function getWebChatWidgetConfig(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): WebChatWidgetConfig {
  const row = getWebChatChannel(channels);
  if (!row) return {};
  return parseWebChatConfig(row.config).widget ?? {};
}

export function resolveWidgetDisplayName(
  agentName: string,
  widget?: WebChatWidgetConfig,
): string {
  const custom = widget?.displayName?.trim();
  return custom || agentName;
}

export function resolveWidgetWelcomeMessage(
  agentWelcome: string | null | undefined,
  widget?: WebChatWidgetConfig,
  isMobile?: boolean,
): string {
  const fallback = agentWelcome?.trim() || "Hello! How can I help you today?";
  if (isMobile && widget?.useMobileWelcome) {
    return widget.welcomeMessageMobile?.trim() || fallback;
  }
  return fallback;
}

export type ResolvedWebChatWidgetSettings = {
  displayName: string;
  welcomeMessage: string;
  placeholder: string;
  suggestedMessages: string[];
  keepShowingSuggested: boolean;
  appearance: WebChatWidgetAppearance;
  primaryColor: string;
  bubbleColor: string;
  autoShowWelcomePopup: boolean;
  welcomePopupDelaySec: number;
  autoShowWelcomePopupMobile: boolean;
  voiceToTextEnabled: boolean;
  attachmentsEnabled: boolean;
};

export function resolveWebChatWidgetSettings(
  agentName: string,
  agentWelcome: string | null | undefined,
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  options?: { isMobile?: boolean },
): ResolvedWebChatWidgetSettings {
  const widget = getWebChatWidgetConfig(channels);
  const primary = widget.primaryColor ?? WIDGET_PRIMARY_COLOR_DEFAULT;
  return {
    displayName: resolveWidgetDisplayName(agentName, widget),
    welcomeMessage: resolveWidgetWelcomeMessage(agentWelcome, widget, options?.isMobile),
    placeholder: widget.placeholder?.trim() || WIDGET_PLACEHOLDER_DEFAULT,
    suggestedMessages: widget.suggestedMessages ?? [],
    keepShowingSuggested: widget.keepShowingSuggested ?? false,
    appearance: widget.appearance ?? "light",
    primaryColor: primary,
    bubbleColor: widget.bubbleColor ?? primary,
    autoShowWelcomePopup: widget.autoShowWelcomePopup ?? false,
    welcomePopupDelaySec: widget.welcomePopupDelaySec ?? WIDGET_POPUP_DELAY_DEFAULT,
    autoShowWelcomePopupMobile: widget.autoShowWelcomePopupMobile ?? false,
    voiceToTextEnabled: widget.voiceToTextEnabled ?? false,
    attachmentsEnabled: widget.attachmentsEnabled ?? false,
  };
}

export function getWebChatChannel(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
) {
  return channels.find((c) => c.channel === "WEB_CHAT");
}

export function getAgentChannel(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  channelType: AgentChannelType,
) {
  return channels.find((c) => c.channel === channelType);
}

export function getEnabledAgentChannelTypes(
  channels: Pick<AgentChannel, "channel" | "enabled">[],
): AgentChannelType[] {
  return channels.filter((c) => c.enabled).map((c) => c.channel);
}

/** Defaults to disabled when channel row is missing. */
export function isWebChatEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  const row = getWebChatChannel(channels);
  if (!row) return false;
  return row.enabled;
}

/** Defaults to disabled when channel row is missing. */
export function isHelpPageEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): boolean {
  const row = getWebChatChannel(channels);
  if (!row) return false;
  const parsed = parseWebChatConfig(row.config);
  return parsed.helpPage?.enabled === true;
}

/** Integration / config-only deployments default to off until enabled. */
export function isIntegrationDeploymentEnabled(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
  entry: Pick<DeployCatalogEntry, "id" | "channelType">,
): boolean {
  if (entry.channelType) {
    const row = getAgentChannel(channels, entry.channelType);
    return row?.enabled ?? false;
  }

  const webChat = getWebChatChannel(channels);
  if (!webChat) return false;
  const parsed = parseWebChatConfig(webChat.config);
  return parsed.integrations?.[entry.id]?.enabled ?? false;
}

export function buildEmbedQueryParams(
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
): string {
  const params = new URLSearchParams();
  if (widgetToken) params.set("token", widgetToken);
  params.set("title", title);
  params.set("welcome", welcome);
  return params.toString();
}
