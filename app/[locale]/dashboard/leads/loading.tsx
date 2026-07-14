import { getTranslations } from "next-intl/server";

export default async function LeadsLoading() {
  const t = await getTranslations("dashboard.deploy.common");
  return <p className="px-6 py-8 text-body-sm text-muted">{t("loading")}</p>;
}
