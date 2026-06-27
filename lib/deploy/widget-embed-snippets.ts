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
    iframe.style.cssText = 'position:fixed;bottom:24px;right:24px;width:80px;height:80px;border:none;background:transparent;z-index:2147483647;overflow:hidden';
    iframe.title = "Chat with ${title}";
    iframe.setAttribute('allow', 'microphone');
    document.getElementById('vocally-widget').appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'vocally-widget-resize') return;
      iframe.style.width = e.data.width;
      iframe.style.height = e.data.height;
    });
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
