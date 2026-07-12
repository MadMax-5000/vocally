import { redirect } from "@/i18n/routing";

export default function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect({ href: "/dashboard/agents", locale });
}
