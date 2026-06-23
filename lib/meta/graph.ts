const GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v25.0";

export function getMetaGraphVersion(): string {
  return process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
}

export function graphUrl(path: string): string {
  const version = getMetaGraphVersion();
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  return `${GRAPH_BASE}/${version}/${trimmed}`;
}

