import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";
import { INDUSTRY_CARDS, type IndustryCopy } from "../industries/industry-cards";

const IndustryStageClient = dynamic(
  () => import("./IndustryStageClient").then((mod) => mod.IndustryStageClient),
  {
    loading: () => (
      <div className="bg-canvas-warm">
        <SectionPlaceholder minHeight={900} />
      </div>
    ),
  }
);

export async function IndustryStage() {
  const t = await getTranslations("landing.industries");

  const cards: IndustryCopy[] = INDUSTRY_CARDS.map((card) => ({
    id: card.id,
    label: t(`cards.${card.id}.label`),
    user: t(`cards.${card.id}.user`),
    agent: t(`cards.${card.id}.agent`),
  }));

  return (
    <IndustryStageClient
      title={t("title")}
      agentLabel={t("agentLabel")}
      reveal={t("reveal")}
      cards={cards}
    />
  );
}
