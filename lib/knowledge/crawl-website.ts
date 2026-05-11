import * as cheerio from "cheerio";

const REQUEST_TIMEOUT_MS = 10_000;
const CRAWL_CONCURRENCY = 3;

function matchPattern(value: string, pattern: string): boolean {
  if (!pattern) return true;
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  try {
    return new RegExp(`^${regexStr}$`).test(value);
  } catch {
    return value.includes(pattern.replace(/\*/g, ""));
  }
}

function sameOrigin(base: URL, candidate: string): boolean {
  try {
    const c = new URL(candidate, base.origin);
    return c.origin === base.origin;
  } catch {
    return false;
  }
}

function normalizeUrl(base: URL, href: string): string | null {
  try {
    const u = new URL(href, base.origin);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function fetchLinks(
  url: string,
  baseOrigin: URL,
): Promise<string[]> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
    });
    if (!res.ok) return [];

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    const links: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const normalized = normalizeUrl(baseOrigin, href);
      if (!normalized) return;
      if (!sameOrigin(baseOrigin, normalized)) return;
      if (normalized.match(/\.(pdf|zip|png|jpg|jpeg|gif|mp4|mp3|exe|dmg)([?#].*)?$/i)) return;
      links.push(normalized);
    });

    return links;
  } catch {
    return [];
  } finally {
    clearTimeout(id);
  }
}

export type CrawlOptions = {
  maxDepth: number;
  maxUrls: number;
  pattern?: string;
};

export type CrawlResult = {
  urls: string[];
  errors: number;
};

export async function crawlWebsite(
  startUrl: string,
  options: CrawlOptions,
): Promise<CrawlResult> {
  const { maxDepth, maxUrls, pattern } = options;
  const baseUrl = new URL(startUrl);
  const seed = normalizeUrl(baseUrl, startUrl);
  if (!seed) return { urls: [], errors: 0 };

  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: seed, depth: 0 }];
  let errors = 0;

  while (queue.length > 0 && visited.size < maxUrls) {
    const batch: typeof queue = [];
    while (queue.length > 0 && batch.length < CRAWL_CONCURRENCY) {
      batch.push(queue.shift()!);
    }

    const results = await Promise.all(
      batch.map(async (item) => {
        if (visited.has(item.url)) return null;
        visited.add(item.url);

        if (item.depth >= maxDepth) return null;

        const links = await fetchLinks(item.url, baseUrl);
        const filtered = links.filter(
          (l) => !visited.has(l) && matchPattern(l, pattern || ""),
        );

        return {
          discovered: filtered.map((l) => ({
            url: l,
            depth: item.depth + 1,
          })),
        };
      }),
    );

    for (const r of results) {
      if (!r) continue;
      for (const link of r.discovered) {
        if (!visited.has(link.url)) {
          queue.push(link);
        }
      }
    }
  }

  const urls = Array.from(visited).slice(0, maxUrls);

  return { urls, errors };
}
