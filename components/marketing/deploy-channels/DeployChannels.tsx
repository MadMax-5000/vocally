import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";
import type { ChannelStep } from "./DeployChannelsClient";

const DeployChannelsClient = dynamic(
  () =>
    import("./DeployChannelsClient").then((mod) => mod.DeployChannelsClient),
  { loading: () => <SectionPlaceholder minHeight={680} /> }
);

export async function DeployChannels() {
  const t = await getTranslations("landing.deployChannels");
  const tHero = await getTranslations("landing.hero");

  const steps: ChannelStep[] = [
    {
      id: "chat",
      number: "01",
      label: t("steps.chat.label"),
      body: t("steps.chat.body"),
      background: "/images/abstract3.webp",
    },
    {
      id: "email",
      number: "02",
      label: t("steps.email.label"),
      body: t("steps.email.body"),
      background: "/images/abstract6.webp",
    },
    {
      id: "voice",
      number: "03",
      label: t("steps.voice.label"),
      body: t("steps.voice.body"),
      background: "/images/abstract1.webp",
    },
  ];

  return (
    <DeployChannelsClient
      title={t("title")}
      cta={tHero("getDemo")}
      createAgentCta={t("cta")}
      steps={steps}
    />
  );
}
