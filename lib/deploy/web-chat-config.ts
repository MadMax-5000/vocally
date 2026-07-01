import type { AgentChannel, AgentChannelType } from "@prisma/client";

import type { DeployCatalogEntry } from "@/lib/constants/deploy-catalog";
import {
  resolveCustomButtonAction,
  type CustomButtonActionConfig,
  type ResolvedCustomButtonAction,
} from "@/lib/deploy/custom-button-action";
import type {
  EscalationActionConfig,
  ResolvedEscalationAction,
} from "@/lib/deploy/escalation-action";
import type { CollectLeadsActionConfig } from "@/lib/deploy/collect-leads-action";
import type {
  CustomFormActionConfig,
  ResolvedCustomFormAction,
} from "@/lib/deploy/custom-form-action";
import {
  parseWebChatActionsConfig,
  resolveSuggestedMessagesAction,
  type ResolvedSuggestedMessagesAction,
  type SuggestedMessagesActionConfig,
} from "@/lib/deploy/suggested-messages-action";

export type { EscalationActionConfig, ResolvedEscalationAction } from "@/lib/deploy/escalation-action";
export { resolveEscalationAction } from "@/lib/deploy/escalation-action";

export type { ResolvedCustomButtonAction } from "@/lib/deploy/custom-button-action";
export type { ResolvedSuggestedMessagesAction } from "@/lib/deploy/suggested-messages-action";
export type {
  CustomFormActionConfig,
  ResolvedCustomFormAction,
} from "@/lib/deploy/custom-form-action";
export { resolveCustomFormAction } from "@/lib/deploy/custom-form-action";

export const WIDGET_PRIMARY_COLOR_DEFAULT = "#FF5A36";
export const WIDGET_PLACEHOLDER_DEFAULT = "Message...";
export const WIDGET_POPUP_DELAY_DEFAULT = 3;
export const HELP_PAGE_HEADLINE_DEFAULT = "How can I help you today?";
export const HELP_PAGE_PLACEHOLDER_DEFAULT = "Ask me anything...";

export type WebChatWidgetAppearance = "light" | "dark";

export type WebChatWidgetConfig = {
  displayName?: string;
  useMobileWelcome?: boolean;
  welcomeMessageMobile?: string;
  autoShowWelcomePopup?: boolean;
  welcomePopupDelaySec?: number;
  autoShowWelcomePopupMobile?: boolean;
  placeholder?: string;
  voiceToTextEnabled?: boolean;
  attachmentsEnabled?: boolean;
  appearance?: WebChatWidgetAppearance;
  primaryColor?: string;
  bubbleColor?: string;
};

export type WebChatHelpPageTheme = WebChatWidgetAppearance;

export type HelpPageNavLinkVariant = "primary" | "default";

export type HelpPageNavLink = {
  label: string;
  href: string;
  variant: HelpPageNavLinkVariant;
};

export type WebChatHelpPageConfig = {
  enabled?: boolean;
  pageTitle?: string;
  headline?: string;
  faviconUrl?: string;
  themeSwitchEnabled?: boolean;
  defaultTheme?: WebChatHelpPageTheme;
  primaryColorLight?: string;
  primaryColorDark?: string;
  voiceToTextEnabled?: boolean;
  logoUrl?: string;
  logoDarkUrl?: string;
  heroUrl?: string;
  heroDarkUrl?: string;
  placeholder?: string;
  navLinks?: HelpPageNavLink[];
};

const MAX_HELP_PAGE_NAV_LINKS = 8;

function parseNavLinks(value: unknown): HelpPageNavLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links: HelpPageNavLink[] = [];
  for (const item of value.slice(0, MAX_HELP_PAGE_NAV_LINKS)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const raw = item as Record<string, unknown>;
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    const href = typeof raw.href === "string" ? raw.href.trim() : "";
    if (!label || !href) continue;
    const variant = raw.variant === "primary" ? "primary" : "default";
    links.push({ label, href, variant });
  }
  return links.length > 0 ? links : [];
}

export type WebChatChannelActionsConfig = {
  suggestedMessages?: SuggestedMessagesActionConfig;
  customButtons?: CustomButtonActionConfig;
  customForm?: CustomFormActionConfig;
  escalations?: EscalationActionConfig;
  collectLeads?: CollectLeadsActionConfig;
};

export type WebChatChannelConfig = {
  helpPage?: WebChatHelpPageConfig;
  integrations?: Record<string, { enabled?: boolean }>;
  widget?: WebChatWidgetConfig;
  actions?: WebChatChannelActionsConfig;
};

function parseUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function parseWebChatHelpPageConfig(config: unknown): WebChatHelpPageConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }
  const raw = config as Record<string, unknown>;
  const result: WebChatHelpPageConfig = {};

  if (typeof raw.enabled === "boolean") {
    result.enabled = raw.enabled;
  }
  if (typeof raw.pageTitle === "string") {
    result.pageTitle = raw.pageTitle.trim() || undefined;
  }
  if (typeof raw.headline === "string") {
    result.headline = raw.headline.trim() || undefined;
  }
  const faviconUrl = parseUrl(raw.faviconUrl);
  if (faviconUrl) result.faviconUrl = faviconUrl;
  if (typeof raw.themeSwitchEnabled === "boolean") {
    result.themeSwitchEnabled = raw.themeSwitchEnabled;
  }
  if (raw.defaultTheme === "light" || raw.defaultTheme === "dark") {
    result.defaultTheme = raw.defaultTheme;
  }
  const primaryLight = parseHexColor(raw.primaryColorLight);
  if (primaryLight) result.primaryColorLight = primaryLight;
  const primaryDark = parseHexColor(raw.primaryColorDark);
  if (primaryDark) result.primaryColorDark = primaryDark;
  if (typeof raw.voiceToTextEnabled === "boolean") {
    result.voiceToTextEnabled = raw.voiceToTextEnabled;
  }
  const logoUrl = parseUrl(raw.logoUrl);
  if (logoUrl) result.logoUrl = logoUrl;
  const logoDarkUrl = parseUrl(raw.logoDarkUrl);
  if (logoDarkUrl) result.logoDarkUrl = logoDarkUrl;
  const heroUrl = parseUrl(raw.heroUrl);
  if (heroUrl) result.heroUrl = heroUrl;
  const heroDarkUrl = parseUrl(raw.heroDarkUrl);
  if (heroDarkUrl) result.heroDarkUrl = heroDarkUrl;
  if (typeof raw.placeholder === "string") {
    result.placeholder = raw.placeholder.trim() || undefined;
  }
  const navLinks = parseNavLinks(raw.navLinks);
  if (navLinks !== undefined) result.navLinks = navLinks;

  return result;
}

function parseHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  return undefined;
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
    result.helpPage = parseWebChatHelpPageConfig(helpPage);
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

  const actions = parseWebChatActionsConfig(raw.actions);
  if (actions) {
    result.actions = actions;
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

export function getWebChatHelpPageConfig(
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): WebChatHelpPageConfig {
  const row = getWebChatChannel(channels);
  if (!row) return {};
  return parseWebChatConfig(row.config).helpPage ?? {};
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
  suggestedMessagesAction: ResolvedSuggestedMessagesAction;
  customButtonsAction: ResolvedCustomButtonAction;
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
  const suggestedMessagesAction = resolveSuggestedMessagesAction(channels);
  const customButtonsAction = resolveCustomButtonAction(channels);
  const primary = widget.primaryColor ?? WIDGET_PRIMARY_COLOR_DEFAULT;
  return {
    displayName: resolveWidgetDisplayName(agentName, widget),
    welcomeMessage: resolveWidgetWelcomeMessage(agentWelcome, widget, options?.isMobile),
    placeholder: widget.placeholder?.trim() || WIDGET_PLACEHOLDER_DEFAULT,
    suggestedMessagesAction,
    customButtonsAction,
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

export type ResolvedWebChatHelpPageSettings = {
  pageTitle: string;
  headline: string;
  faviconUrl?: string;
  themeSwitchEnabled: boolean;
  defaultTheme: WebChatHelpPageTheme;
  primaryColorLight: string;
  primaryColorDark: string;
  voiceToTextEnabled: boolean;
  logoUrl?: string;
  logoDarkUrl?: string;
  heroUrl?: string;
  heroDarkUrl?: string;
  suggestedMessagesAction: ResolvedSuggestedMessagesAction;
  customButtonsAction: ResolvedCustomButtonAction;
  placeholder: string;
  navLinks: HelpPageNavLink[];
};

export function resolveWebChatHelpPageSettings(
  agentName: string,
  channels: Pick<AgentChannel, "channel" | "enabled" | "config">[],
): ResolvedWebChatHelpPageSettings {
  const helpPage = getWebChatHelpPageConfig(channels);
  const primary = WIDGET_PRIMARY_COLOR_DEFAULT;

  return {
    pageTitle: helpPage.pageTitle?.trim() || agentName,
    headline: helpPage.headline?.trim() || HELP_PAGE_HEADLINE_DEFAULT,
    faviconUrl: helpPage.faviconUrl,
    themeSwitchEnabled: helpPage.themeSwitchEnabled ?? false,
    defaultTheme: helpPage.defaultTheme ?? "light",
    primaryColorLight: helpPage.primaryColorLight ?? primary,
    primaryColorDark: helpPage.primaryColorDark ?? primary,
    voiceToTextEnabled: helpPage.voiceToTextEnabled ?? false,
    logoUrl: helpPage.logoUrl,
    logoDarkUrl: helpPage.logoDarkUrl,
    heroUrl: helpPage.heroUrl,
    heroDarkUrl: helpPage.heroDarkUrl,
    suggestedMessagesAction: resolveSuggestedMessagesAction(channels),
    customButtonsAction: resolveCustomButtonAction(channels),
    placeholder: helpPage.placeholder?.trim() || HELP_PAGE_PLACEHOLDER_DEFAULT,
    navLinks: helpPage.navLinks ?? [],
  };
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

export type WidgetEmbedLayout = "inline" | "floating";

export function buildEmbedQueryParams(
  widgetToken: string | null | undefined,
  title: string,
  welcome: string,
  layout?: WidgetEmbedLayout,
): string {
  const params = new URLSearchParams();
  if (widgetToken) params.set("token", widgetToken);
  params.set("title", title);
  params.set("welcome", welcome);
  if (layout === "floating") params.set("layout", "floating");
  return params.toString();
}
