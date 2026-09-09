import { getTranslations } from "next-intl/server";

import { BoldStats } from "@/components/ui/stats-bold";

export async function BoldStatsSection() {
  const t = await getTranslations("landing.boldStats");

  return (
    <BoldStats
      heading={t("heading")}
      imageSrc="/images/cdn-image.jpg"
      imageAlt=""
      stats={[
        { value: t("stats.resolution.value"), label: t("stats.resolution.label") },
        { value: t("stats.latency.value"), label: t("stats.latency.label") },
        { value: t("stats.channels.value"), label: t("stats.channels.label") },
        { value: t("stats.alwaysOn.value"), label: t("stats.alwaysOn.label") },
      ]}
    />
  );
}
