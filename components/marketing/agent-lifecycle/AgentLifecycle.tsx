import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";
import type { LifecycleStep } from "./AgentLifecycleClient";

const AgentLifecycleClient = dynamic(
  () =>
    import("./AgentLifecycleClient").then((mod) => mod.AgentLifecycleClient),
  { loading: () => <SectionPlaceholder minHeight={800} /> }
);

export async function AgentLifecycle() {
  const t = await getTranslations("landing.lifecycle");

  const steps: LifecycleStep[] = [
    {
      id: "build",
      label: t("steps.build.label"),
      body: t("steps.build.body"),
    },
    {
      id: "test",
      label: t("steps.test.label"),
      body: t("steps.test.body"),
    },
    {
      id: "deploy",
      label: t("steps.deploy.label"),
      body: t("steps.deploy.body"),
    },
    {
      id: "optimize",
      label: t("steps.optimize.label"),
      body: t("steps.optimize.body"),
    },
  ];

  return (
    <AgentLifecycleClient
      eyebrow={t("eyebrow")}
      title={t("title")}
      titleMuted={t("titleMuted")}
      cardCta={t("cardCta")}
      steps={steps}
    />
  );
}
