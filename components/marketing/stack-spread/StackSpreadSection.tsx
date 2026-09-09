import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";

const StackSpread = dynamic(() => import("@/components/ui/stack-spread"), {
  loading: () => <SectionPlaceholder minHeight={800} />,
});

export async function StackSpreadSection() {
  const t = await getTranslations("landing.stackSpread");

  return (
    <StackSpread
      title={t("title")}
      titleMuted={t("titleMuted")}
      titleEnd={t("titleEnd")}
      subtitle={t("subtitle")}
      scrollHint={t("scrollHint")}
    />
  );
}
