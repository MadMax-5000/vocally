export type WidgetEmbedSnippetKind = "iframe" | "floating";

export function buildWidgetIframeSnippet(embedUrl: string, title: string): string {
  return `<iframe
  src="${embedUrl}"
  style="width:100%;height:600px;border:none;border-radius:12px"
  title="Chat with ${title}"
></iframe>`;
}

export function buildWidgetFloatingSnippet(embedUrl: string, title: string): string {
  return `<div id="vocally-widget"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = "${embedUrl}";
    iframe.style.cssText = 'position:fixed;bottom:24px;right:24px;width:380px;height:540px;border:none;border-radius:16px;z-index:2147483647;box-shadow:0 8px 32px rgba(0,0,0,0.12)';
    iframe.title = "Chat with ${title}";
    document.getElementById('vocally-widget').appendChild(iframe);
  })();
</script>`;
}

export function buildWidgetEmbedSnippet(
  kind: WidgetEmbedSnippetKind,
  embedUrl: string,
  title: string,
): string {
  return kind === "iframe"
    ? buildWidgetIframeSnippet(embedUrl, title)
    : buildWidgetFloatingSnippet(embedUrl, title);
}
