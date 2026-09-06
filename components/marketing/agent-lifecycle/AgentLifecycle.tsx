import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";
import type { LifecycleStep } from "./AgentLifecycleClient";

const AgentLifecycleClient = dynamic(
  () =>
    import("./AgentLifecycleClient").then((mod) => mod.AgentLifecycleClient),
  { loading: () => <SectionPlaceholder minHeight={640} /> }
);

export async function AgentLifecycle() {
  const t = await getTranslations("landing.lifecycle");
  const tHero = await getTranslations("landing.hero");

  const steps: LifecycleStep[] = [
    {
      id: "build",
      number: "01",
      label: t("steps.build.label"),
      body: t("steps.build.body"),
      background: "/images/abstract1.webp",
    },
    {
      id: "test",
      number: "02",
      label: t("steps.test.label"),
      body: t("steps.test.body"),
      background: "/images/abstract2.webp",
    },
    {
      id: "deploy",
      number: "03",
      label: t("steps.deploy.label"),
      body: t("steps.deploy.body"),
      background: "/images/abtract4.webp",
    },
    {
      id: "optimize",
      number: "04",
      label: t("steps.optimize.label"),
      body: t("steps.optimize.body"),
      background: "/images/abstract5.webp",
    },
  ];

  return (
    <AgentLifecycleClient
      title={t("title")}
      cta={tHero("getDemo")}
      createAgentCta={t("cta")}
      steps={steps}
    />
  );
}
