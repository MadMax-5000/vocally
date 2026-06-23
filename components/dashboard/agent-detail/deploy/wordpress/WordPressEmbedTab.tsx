"use client";

import { WidgetEmbedSnippetSection } from "@/components/dashboard/agent-detail/deploy/WidgetEmbedSnippetSection";

type WordPressEmbedTabProps = {
  embedUrl: string;
};

export function WordPressEmbedTab({ embedUrl }: WordPressEmbedTabProps) {
  return (
    <WidgetEmbedSnippetSection
      embedUrl={embedUrl}
      description="Paste embed code into WordPress without the plugin — use a Custom HTML block, WPCode footer snippet, or your theme footer."
      iframeHint="Add a Custom HTML block on a page and paste this iframe for an inline chat section."
      floatingHint="Paste in Settings → Insert Headers and Footers (footer) or WPCode to show a floating bubble site-wide."
    />
  );
}
