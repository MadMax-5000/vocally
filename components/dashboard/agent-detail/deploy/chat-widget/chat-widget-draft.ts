import {
  getWebChatWidgetConfig,
  WIDGET_PLACEHOLDER_DEFAULT,
  WIDGET_POPUP_DELAY_DEFAULT,
  WIDGET_PRIMARY_COLOR_DEFAULT,
  type WebChatWidgetAppearance,
  type WebChatWidgetConfig,
} from "@/lib/deploy/web-chat-config";

import type { AgentDetailWithRelations } from "../../agent-detail-types";

export type ChatWidgetDraft = {
  welcomeMessage: string;
  widget: Required<
    Pick<
      WebChatWidgetConfig,
      | "useMobileWelcome"
      | "autoShowWelcomePopup"
      | "welcomePopupDelaySec"
      | "autoShowWelcomePopupMobile"
      | "voiceToTextEnabled"
      | "attachmentsEnabled"
    >
  > &
    WebChatWidgetConfig & {
      displayName: string;
      welcomeMessageMobile: string;
      placeholder: string;
      appearance: WebChatWidgetAppearance;
      primaryColor: string;
      bubbleColor: string;
    };
};

export function buildChatWidgetDraft(agent: AgentDetailWithRelations): ChatWidgetDraft {
  const stored = getWebChatWidgetConfig(agent.channels);
  const primary = stored.primaryColor ?? WIDGET_PRIMARY_COLOR_DEFAULT;

  return {
    welcomeMessage:
      agent.welcomeMessage?.trim() || "Hello! How can I help you today?",
    widget: {
      displayName: stored.displayName?.trim() ?? "",
      useMobileWelcome: stored.useMobileWelcome ?? false,
      welcomeMessageMobile:
        stored.welcomeMessageMobile?.trim() ||
        agent.welcomeMessage?.trim() ||
        "Hello! How can I help you today?",
      autoShowWelcomePopup: stored.autoShowWelcomePopup ?? false,
      welcomePopupDelaySec: stored.welcomePopupDelaySec ?? WIDGET_POPUP_DELAY_DEFAULT,
      autoShowWelcomePopupMobile: stored.autoShowWelcomePopupMobile ?? false,
      placeholder: stored.placeholder?.trim() || WIDGET_PLACEHOLDER_DEFAULT,
      voiceToTextEnabled: stored.voiceToTextEnabled ?? false,
      attachmentsEnabled: stored.attachmentsEnabled ?? false,
      appearance: stored.appearance ?? "light",
      primaryColor: primary,
      bubbleColor: stored.bubbleColor ?? primary,
    },
  };
}

export function draftsEqual(a: ChatWidgetDraft, b: ChatWidgetDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function draftToSavePayload(draft: ChatWidgetDraft) {
  const w = draft.widget;
  return {
    welcomeMessage: draft.welcomeMessage.trim() || null,
    widget: {
      displayName: w.displayName.trim() || null,
      useMobileWelcome: w.useMobileWelcome,
      welcomeMessageMobile: w.welcomeMessageMobile.trim() || null,
      autoShowWelcomePopup: w.autoShowWelcomePopup,
      welcomePopupDelaySec: w.welcomePopupDelaySec,
      autoShowWelcomePopupMobile: w.autoShowWelcomePopupMobile,
      placeholder: w.placeholder.trim() || null,
      voiceToTextEnabled: w.voiceToTextEnabled,
      attachmentsEnabled: w.attachmentsEnabled,
      appearance: w.appearance,
      primaryColor: w.primaryColor,
      bubbleColor: w.bubbleColor,
    },
  };
}
