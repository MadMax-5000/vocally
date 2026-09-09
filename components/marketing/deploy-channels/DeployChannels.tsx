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

  const steps: ChannelStep[] = [
    {
      id: "chat",
      label: t("steps.chat.label"),
    },
    {
      id: "email",
      label: t("steps.email.label"),
    },
    {
      id: "voice",
      label: t("steps.voice.label"),
    },
  ];

  return <DeployChannelsClient title={t("title")} steps={steps} />;
}
