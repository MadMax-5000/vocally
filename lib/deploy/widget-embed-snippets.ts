export type WidgetEmbedSnippetKind = "iframe" | "floating";

export function buildWidgetIframeSnippet(embedUrl: string, title: string): string {
  return `<iframe
  src="${embedUrl}"
  style="width:100%;height:600px;border:none;border-radius:12px"
  title="Chat with ${title}"
></iframe>`;
}

export function buildWidgetFloatingSnippet(embedUrl: string, title: string): string {
  return `<div id="anselio-widget"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = "${embedUrl}";
    iframe.style.cssText = 'position:fixed;bottom:4px;inset-inline-end:4px;width:380px;height:128px;max-width:calc(100vw - 8px);border:none;background:transparent;z-index:2147483647;overflow:hidden';
    iframe.title = "Chat with ${title}";
    iframe.setAttribute('allow', 'microphone');
    document.getElementById('anselio-widget').appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'anselio-widget-resize') return;
      iframe.style.width = e.data.width;
      iframe.style.height = e.data.height;
    });
    document.addEventListener('pointerdown', function(e) {
      if (e.target === iframe) return;
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'anselio-widget-dismiss' }, '*');
      }
    }, true);
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
