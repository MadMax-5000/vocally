import * as Sentry from "@sentry/nextjs";
import * as cheerio from "cheerio";

const MAX_SITEMAP_URLS = 1_000;
const SUB_SITEMAP_CONCURRENCY = 3;

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

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const res = await fetch(sitemapUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching sitemap ${sitemapUrl}`);
  }

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const isIndex = $("sitemapindex").length > 0 || $("sitemap").length > 0;

  if (isIndex) {
    const subSitemaps: string[] = [];
    $("sitemap > loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) subSitemaps.push(loc);
    });

    const results: string[] = [];
    const batches: string[][] = [];
    for (let i = 0; i < subSitemaps.length; i += SUB_SITEMAP_CONCURRENCY) {
      batches.push(subSitemaps.slice(i, i + SUB_SITEMAP_CONCURRENCY));
    }

    for (const batch of batches) {
      const pages = await Promise.all(
        batch.map(async (subUrl) => {
          try {
            return await fetchSitemapUrls(subUrl);
          } catch (err) {
            Sentry.captureException(err, { extra: { subSitemapUrl: subUrl } });
            return [] as string[];
          }
        }),
      );
      for (const p of pages) {
        results.push(...p);
        if (results.length >= MAX_SITEMAP_URLS) break;
      }
      if (results.length >= MAX_SITEMAP_URLS) break;
    }

    return results.slice(0, MAX_SITEMAP_URLS);
  }

  const urls: string[] = [];
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });

  return urls.slice(0, MAX_SITEMAP_URLS);
}

export async function parseSitemap(
  sitemapUrl: string,
  pattern?: string,
): Promise<string[]> {
  const allUrls = await fetchSitemapUrls(sitemapUrl);

  if (!pattern) return allUrls;

  return allUrls.filter((url) => matchPattern(url, pattern));
}
