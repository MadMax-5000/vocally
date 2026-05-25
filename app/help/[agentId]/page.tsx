import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadPublicHelpPageData } from "@/lib/deploy/load-help-page-settings";

import { HelpPageClient } from "./HelpPageClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { title?: string };
}): Promise<Metadata> {
  const data = await loadPublicHelpPageData(params.agentId, {
    titleOverride: searchParams.title,
  });

  if (!data) {
    return { title: "Help" };
  }

  return {
    title: data.settings.pageTitle,
    ...(data.settings.faviconUrl
      ? { icons: { icon: data.settings.faviconUrl } }
      : {}),
  };
}

export default async function HelpPage({
  params,
  searchParams,
}: {
  params: { agentId: string };
  searchParams: { token?: string; title?: string; headline?: string };
}) {
  const data = await loadPublicHelpPageData(params.agentId, {
    widgetToken: searchParams.token,
    titleOverride: searchParams.title,
    headlineOverride: searchParams.headline,
  });

  if (!data) notFound();

  return (
    <HelpPageClient data={data} sidebarLabel={data.agentName} />
  );
}
