import * as cheerio from "cheerio";

export type FetchedPage = {
  url: string;
  title: string;
  content: string;
};

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchAndExtractText(url: string): Promise<FetchedPage> {
  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error(`Unsupported content-type "${contentType}" for ${url}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, .sidebar, .nav, .footer, .header, noscript, iframe, svg, form, .menu").remove();

  const pageTitle =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    new URL(url).hostname;

  const body = $("body");
  body.find("nav, footer, header, aside, .sidebar, .nav, .footer, .header, noscript, script, style").remove();

  let text = body.text();

  text = text.replace(/\t/g, " ");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  if (!text) {
    throw new Error(`No extractable content found at ${url}`);
  }

  return { url, title: pageTitle, content: text };
}
