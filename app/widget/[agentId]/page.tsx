import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadPublicWidgetPageData } from "@/lib/deploy/load-widget-settings";
import type { WidgetEmbedLayout } from "@/lib/deploy/web-chat-config";
import { noIndexMetadata } from "@/lib/seo/metadata";

import { WidgetPageClient } from "./WidgetPageClient";

export const metadata: Metadata = noIndexMetadata;

function parseWidgetLayout(value: string | undefined): WidgetEmbedLayout {
  return value === "floating" ? "floating" : "inline";
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { token?: string; title?: string; welcome?: string; layout?: string };
}) {
  const data = await loadPublicWidgetPageData(params.agentId, {
    widgetToken: searchParams.token,
    titleOverride: searchParams.title,
    welcomeOverride: searchParams.welcome,
  });

  if (!data) notFound();

  return (
    <WidgetPageClient data={data} layout={parseWidgetLayout(searchParams.layout)} />
  );
}
