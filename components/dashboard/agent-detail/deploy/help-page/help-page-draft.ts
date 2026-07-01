import {
  getWebChatHelpPageConfig,
  HELP_PAGE_HEADLINE_DEFAULT,
  HELP_PAGE_PLACEHOLDER_DEFAULT,
  WIDGET_PRIMARY_COLOR_DEFAULT,
  type HelpPageNavLink,
  type WebChatHelpPageTheme,
} from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "../../agent-detail-types";

export type HelpPageDraft = {
  helpPage: {
    pageTitle: string;
    headline: string;
    faviconUrl: string;
    themeSwitchEnabled: boolean;
    defaultTheme: WebChatHelpPageTheme;
    primaryColorLight: string;
    primaryColorDark: string;
    voiceToTextEnabled: boolean;
    logoUrl: string;
    logoDarkUrl: string;
    heroUrl: string;
    heroDarkUrl: string;
    placeholder: string;
    navLinks: HelpPageNavLink[];
  };
};

export function buildHelpPageDraft(agent: AgentDetailWithRelations): HelpPageDraft {
  const stored = getWebChatHelpPageConfig(agent.channels);
  const primary = WIDGET_PRIMARY_COLOR_DEFAULT;

  return {
    helpPage: {
      pageTitle: stored.pageTitle?.trim() || agent.name,
      headline: stored.headline?.trim() || HELP_PAGE_HEADLINE_DEFAULT,
      faviconUrl: stored.faviconUrl ?? "",
      themeSwitchEnabled: stored.themeSwitchEnabled ?? false,
      defaultTheme: stored.defaultTheme ?? "light",
      primaryColorLight: stored.primaryColorLight ?? primary,
      primaryColorDark: stored.primaryColorDark ?? primary,
      voiceToTextEnabled: stored.voiceToTextEnabled ?? false,
      logoUrl: stored.logoUrl ?? "",
      logoDarkUrl: stored.logoDarkUrl ?? "",
      heroUrl: stored.heroUrl ?? "",
      heroDarkUrl: stored.heroDarkUrl ?? "",
      placeholder: stored.placeholder?.trim() || HELP_PAGE_PLACEHOLDER_DEFAULT,
      navLinks: stored.navLinks ?? [],
    },
  };
}

export function draftsEqual(a: HelpPageDraft, b: HelpPageDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function draftToSavePayload(draft: HelpPageDraft) {
  const hp = draft.helpPage;
  return {
    helpPage: {
      pageTitle: hp.pageTitle.trim() || null,
      headline: hp.headline.trim() || null,
      faviconUrl: hp.faviconUrl.trim() || null,
      themeSwitchEnabled: hp.themeSwitchEnabled,
      defaultTheme: hp.defaultTheme,
      primaryColorLight: hp.primaryColorLight,
      primaryColorDark: hp.primaryColorDark,
      voiceToTextEnabled: hp.voiceToTextEnabled,
      logoUrl: hp.logoUrl.trim() || null,
      logoDarkUrl: hp.logoDarkUrl.trim() || null,
      heroUrl: hp.heroUrl.trim() || null,
      heroDarkUrl: hp.heroDarkUrl.trim() || null,
      placeholder: hp.placeholder.trim() || null,
      navLinks: hp.navLinks
        .filter((l) => l.label.trim() && l.href.trim())
        .map((l) => ({
          label: l.label.trim(),
          href: l.href.trim(),
          variant: l.variant,
        })),
    },
  };
}
