import { getTranslations } from "next-intl/server";

import { DeployChannelsClient } from "./DeployChannelsClient";
import type { ChannelStep } from "./DeployChannelsClient";

export async function DeployChannels() {
  const t = await getTranslations("landing.deployChannels");

  const steps: ChannelStep[] = [
    {
      id: "chat",
      number: "01",
      label: t("steps.chat.label"),
      body: t("steps.chat.body"),
      background: "/images/abstract3.jpeg",
    },
    {
      id: "email",
      number: "02",
      label: t("steps.email.label"),
      body: t("steps.email.body"),
      background: "/images/abstract6.jpeg",
    },
    {
      id: "voice",
      number: "03",
      label: t("steps.voice.label"),
      body: t("steps.voice.body"),
      background: "/images/abstract1.png",
    },
  ];

  return <DeployChannelsClient title={t("title")} cta={t("cta")} steps={steps} />;
}
