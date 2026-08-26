import { getTranslations } from "next-intl/server";

import { AgentLifecycleClient } from "./AgentLifecycleClient";
import type { LifecycleStep } from "./AgentLifecycleClient";

export async function AgentLifecycle() {
  const t = await getTranslations("landing.lifecycle");

  const steps: LifecycleStep[] = [
    {
      id: "build",
      number: "01",
      label: t("steps.build.label"),
      body: t("steps.build.body"),
      background: "/images/abstract1.png",
    },
    {
      id: "test",
      number: "02",
      label: t("steps.test.label"),
      body: t("steps.test.body"),
      background: "/images/abstract2.png",
    },
    {
      id: "deploy",
      number: "03",
      label: t("steps.deploy.label"),
      body: t("steps.deploy.body"),
      background: "/images/abtract4.png",
    },
    {
      id: "optimize",
      number: "04",
      label: t("steps.optimize.label"),
      body: t("steps.optimize.body"),
      background: "/images/abstract5.jpeg",
    },
  ];

  return <AgentLifecycleClient title={t("title")} cta={t("cta")} steps={steps} />;
}
