import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { SectionPlaceholder } from "@/components/marketing/SectionPlaceholder";
import { INDUSTRY_CARDS, type IndustryCopy } from "./industry-cards";

const IndustriesClient = dynamic(
  () => import("./IndustriesClient").then((mod) => mod.IndustriesClient),
  { loading: () => <SectionPlaceholder minHeight={640} /> }
);

export async function Industries() {
  const t = await getTranslations("landing.industries");

  const cards: IndustryCopy[] = INDUSTRY_CARDS.map((card) => ({
    id: card.id,
    label: t(`cards.${card.id}.label`),
    user: t(`cards.${card.id}.user`),
    agent: t(`cards.${card.id}.agent`),
  }));

  return (
    <IndustriesClient
      title={t("title")}
      agentLabel={t("agentLabel")}
      prevLabel={t("prev")}
      nextLabel={t("next")}
      cards={cards}
    />
  );
}
