"use client";

import { useMemo } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChatWidgetFloating } from "@/components/chat/ChatWidgetFloating";
import type { ResolvedSuggestedMessagesAction } from "@/lib/deploy/suggested-messages-action";
import type { ResolvedCustomButtonAction } from "@/lib/deploy/custom-button-action";

const ASSISTANT_AGENT_ID =
  process.env.NEXT_PUBLIC_PRODUCT_ASSISTANT_AGENT_ID ?? "";

const BRAND_COLOR = "#FF5A36";

const AUTH_PATH_pattern = /\/sign-(in|up)/;

export function ProductAssistantWidget() {
  const t = useTranslations("dashboard.productAssistant");
  const { user } = useUser();
  const { organization } = useOrganization();
  const pathname = usePathname();

  const visible = useMemo(() => {
    if (!ASSISTANT_AGENT_ID) return false;
    if (pathname && AUTH_PATH_pattern.test(pathname)) return false;
    return true;
  }, [pathname]);

  const context = useMemo(() => {
    if (!pathname) return undefined;
    const parts: string[] = [`page=${pathname}`];
    if (organization?.name) parts.push(`org=${organization.name}`);
    return parts.join(", ");
  }, [pathname, organization?.name]);

  const welcomeMessage = useMemo(() => {
    const firstName =
      user?.firstName || user?.fullName?.split(" ")[0] || t("fallbackName");
    return t("welcomeMessage", { firstName });
  }, [t, user?.firstName, user?.fullName]);

  const suggestedMessagesAction = useMemo<ResolvedSuggestedMessagesAction>(
    () => ({
      enabled: true,
      staticStarters: [
        t("suggestions.createAgent"),
        t("suggestions.plans"),
        t("suggestions.connectTwilio"),
        t("suggestions.deployWidget"),
        t("suggestions.knowledgeBase"),
      ],
      keepShowingAfterFirst: true,
      dynamicEnabled: false,
    }),
    [t],
  );

  const customButtonsAction = useMemo<ResolvedCustomButtonAction>(
    () => ({
      enabled: true,
      buttons: [
        {
          label: t("contactSupport"),
          kind: "link",
          href: "mailto:support@anselio.com",
          openInNewTab: true,
        },
      ],
    }),
    [t],
  );

  if (!visible) return null;

  return (
    <ChatWidgetFloating
      agentId={ASSISTANT_AGENT_ID}
      agentName={t("agentName")}
      welcomeMessage={welcomeMessage}
      bubbleColor={BRAND_COLOR}
      primaryColor={BRAND_COLOR}
      appearance="light"
      placeholder={t("placeholder")}
      showPoweredBy={false}
      autoShowWelcomePopup={true}
      autoShowWelcomePopupMobile={false}
      welcomePopupDelaySec={5}
      voiceToTextEnabled={false}
      suggestedMessagesAction={suggestedMessagesAction}
      customButtonsAction={customButtonsAction}
      context={context}
    />
  );
}
