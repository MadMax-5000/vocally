"use client";

import { WidgetEmbedSnippetSection } from "@/components/dashboard/agent-detail/deploy/WidgetEmbedSnippetSection";
import { useDeploySitesMessages } from "../useDeploySitesMessages";

type WordPressEmbedTabProps = {
  inlineEmbedUrl: string;
  floatingEmbedUrl: string;
};

export function WordPressEmbedTab({
  inlineEmbedUrl,
  floatingEmbedUrl,
}: WordPressEmbedTabProps) {
  const t = useDeploySitesMessages().wordpress.embed;

  return (
    <WidgetEmbedSnippetSection
      inlineEmbedUrl={inlineEmbedUrl}
      floatingEmbedUrl={floatingEmbedUrl}
      description={t.description}
      iframeHint={t.iframeHint}
      floatingHint={t.floatingHint}
    />
  );
}
