import { getTranslations } from "next-intl/server";

export async function ClerkUnconfiguredMessage() {
  const t = await getTranslations("auth");
  return <p className="text-body-md text-pretty text-body">{t("missingClerkKeys")}</p>;
}
