import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";

export default async function EmailInboundPage() {
  const t = await getTranslations("dashboard.common");
  const session = await auth();
  if (session.orgId) {
    redirect("/dashboard/agents");
  }
  
  return (
    <p className="text-body-sm text-muted">
      {t("selectOrganizationFirst")}
    </p>
  );
}
