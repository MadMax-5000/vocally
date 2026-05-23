import { notFound } from "next/navigation";

import { loadPublicWidgetPageData } from "@/lib/deploy/load-widget-settings";

import { WidgetPageClient } from "./WidgetPageClient";

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { token?: string; title?: string; welcome?: string };
}) {
  const data = await loadPublicWidgetPageData(params.agentId, {
    widgetToken: searchParams.token,
    titleOverride: searchParams.title,
    welcomeOverride: searchParams.welcome,
  });

  if (!data) notFound();

  return <WidgetPageClient data={data} />;
}
