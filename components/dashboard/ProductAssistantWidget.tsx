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

export function ProductAssistantWidget() {
  const t = useTranslations("dashboard.productAssistant");
  const { user, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const pathname = usePathname();

  const context = useMemo(() => {
    if (!pathname) return undefined;
    const parts: string[] = [`page=${pathname}`];
    if (organization?.name) parts.push(`org=${organization.name}`);
    return parts.join(", ");
  }, [pathname, organization?.name]);

  const welcomeMessage = useMemo(() => {
    if (!isSignedIn) return t("guestWelcomeMessage");
    const firstName =
      user?.firstName || user?.fullName?.split(" ")[0] || t("fallbackName");
    return t("welcomeMessage", { firstName });
  }, [t, isSignedIn, user?.firstName, user?.fullName]);

  const suggestedMessagesAction = useMemo<ResolvedSuggestedMessagesAction>(
    () => ({
      enabled: true,
      staticStarters: isSignedIn
        ? [
            t("suggestions.createAgent"),
            t("suggestions.plans"),
            t("suggestions.connectTwilio"),
            t("suggestions.deployWidget"),
            t("suggestions.knowledgeBase"),
          ]
        : [
            t("suggestions.whatIsAnselio"),
            t("suggestions.plans"),
            t("suggestions.languages"),
            t("suggestions.startTrial"),
          ],
      keepShowingAfterFirst: true,
      dynamicEnabled: false,
    }),
    [t, isSignedIn],
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

  if (!ASSISTANT_AGENT_ID) return null;

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
      launcherSize="lg"
      suggestedMessagesAction={suggestedMessagesAction}
      customButtonsAction={customButtonsAction}
      context={context}
    />
  );
}
