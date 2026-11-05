#!/usr/bin/env node
/**
 * Verifies, from the outside, that AI and answer-engine crawlers can actually read the site.
 *
 *   node scripts/verify-ai-visibility.mjs                 # checks https://anselio.com
 *   node scripts/verify-ai-visibility.mjs http://localhost:3000
 *
 * Three questions, in order:
 *   1. Is the robots.txt the site actually serves free of a CDN-managed block that disallows
 *      the crawlers behind AI answers?
 *   2. Does a fetch as each vendor's user agent return the same readable copy as a browser -
 *      no challenge page, no empty shell?
 *   3. Are the pages an assistant would quote (FAQ, comparison, about, llms.txt) live?
 *
 * Exits non-zero on the first failure category so it can be used in a deploy check.
 * See docs/ai-visibility.md for what to do about each failure.
 */

const BASE = (process.argv[2] || "https://anselio.com").replace(/\/$/, "");
const LOCALES = ["en", "fr", "ar"];

/** Tokens that must be able to fetch the site for AI answers to cite it. */
const ANSWER_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Googlebot",
  "bingbot",
  "Applebot",
  "meta-webindexer",
  "MistralAI-Index",
  "DuckAssistBot",
];

const results = [];
const record = (area, name, ok, detail) => results.push({ area, name, ok, detail });

async function fetchAs(path, userAgent) {
  const res = await fetch(BASE + path, {
    headers: userAgent ? { "user-agent": userAgent } : {},
    redirect: "follow",
  });
  return {
    status: res.status,
    headers: res.headers,
    text: await res.text(),
  };
}

/** Readable text of the response, with scripts and tags stripped. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonLdTypes(html) {
  const types = [];
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    try {
      const data = JSON.parse(match[1]);
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        if (node["@type"]) types.push(String(node["@type"]));
        Object.values(node).forEach(walk);
      };
      walk(data);
    } catch {
      types.push("INVALID_JSON");
    }
  }
  return types;
}

/** Parses robots.txt into groups of { agents, rules }. */
function parseRobots(text) {
  const groups = [];
  let current = { agents: [], rules: [] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [directive, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = directive.toLowerCase();
    if (key === "user-agent") {
      // A User-Agent line after rules starts a new group.
      if (current.rules.length > 0) {
        groups.push(current);
        current = { agents: [], rules: [] };
      }
      current.agents.push(value);
    } else if (key === "allow" || key === "disallow") {
      current.rules.push({ type: key, path: value });
    }
  }
  groups.push(current);
  return groups;
}

// ── 1. robots.txt ────────────────────────────────────────────────────────────
const robots = await fetchAs("/robots.txt");
const robotsText = robots.text;
record("robots", "returns 200 text/plain", robots.status === 200 && /text\/plain/.test(robots.headers.get("content-type") || ""), `${robots.status} ${robots.headers.get("content-type") || "no type"}`);

record(
  "robots",
  "no managed CDN block prepended",
  !/BEGIN Cloudflare Managed content/i.test(robotsText),
  /BEGIN Cloudflare Managed content/i.test(robotsText)
    ? "Cloudflare is still prepending its block — see docs/ai-visibility.md §2"
    : "origin file served as written",
);

const groups = parseRobots(robotsText);
const blocked = [];
for (const agent of ANSWER_AGENTS) {
  const matching = groups.filter((group) =>
    group.agents.some((token) => token === "*" || token === agent),
  );
  // A site-wide Disallow wins over Allow in every group that names the agent.
  const disallowedRoot = matching.some((group) =>
    group.rules.some((rule) => rule.type === "disallow" && (rule.path === "/" || rule.path === "")),
  );
  if (disallowedRoot) blocked.push(agent);
}
record("robots", "no answer-engine agent is disallowed from /", blocked.length === 0, blocked.join(", ") || `${ANSWER_AGENTS.length} agents allowed`);
record("robots", "sitemap declared", /sitemap:\s*https?:\/\//i.test(robotsText));

// ── 2. What each crawler actually receives ───────────────────────────────────
const browserHome = await fetchAs(`/${LOCALES[0]}`);
const browserWords = visibleText(browserHome.text).split(" ").length;

for (const agent of ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "Googlebot", "bingbot"]) {
  const ua = `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ${agent}/1.0`;
  const res = await fetchAs(`/${LOCALES[0]}`, ua);
  const text = visibleText(res.text);
  const mitigated = res.headers.get("cf-mitigated");
  record(
    "crawler fetch",
    `${agent} gets 200 and the full page`,
    res.status === 200 && !mitigated && text.split(" ").length >= browserWords * 0.9,
    `${res.status}${mitigated ? ` challenged (${mitigated})` : ""}, ${text.split(" ").length} vs ${browserWords} words`,
  );
  record(
    "crawler fetch",
    `${agent} sees prices in the HTML`,
    /\d[\d.,\s]*MAD/.test(text),
  );
}

// ── 3. Pages worth quoting ───────────────────────────────────────────────────
const homeTypes = jsonLdTypes(browserHome.text);
for (const type of ["Organization", "WebSite", "SoftwareApplication", "Offer"]) {
  record("structured data", `home emits ${type}`, homeTypes.includes(type), homeTypes.join(","));
}
record("structured data", "no invalid JSON-LD on home", !homeTypes.includes("INVALID_JSON"));

const faq = await fetchAs(`/${LOCALES[0]}/faq`);
const faqTypes = jsonLdTypes(faq.text);
record("pages", "/faq serves questions in HTML", (faq.text.match(/<dt[^>]*>/g) || []).length >= 8, `${(faq.text.match(/<dt[^>]*>/g) || []).length} questions`);
record("pages", "/faq emits FAQPage", faqTypes.includes("FAQPage"));

for (const path of ["/compare", "/about"]) {
  for (const locale of LOCALES) {
    const res = await fetchAs(`/${locale}${path}`);
    record("pages", `/${locale}${path} is 200 with content`, res.status === 200 && visibleText(res.text).split(" ").length > 300, `${res.status}, ${visibleText(res.text).split(" ").length} words`);
  }
}

const llms = await fetchAs("/llms.txt");
record("llms", "/llms.txt is 200 text/plain", llms.status === 200 && /text\/plain/.test(llms.headers.get("content-type") || ""), `${llms.status}`);
record("llms", "/llms.txt states the canonical facts", llms.text.startsWith("# Anselio") && /\d[\d.,\s]*MAD/.test(llms.text), `${llms.text.length} bytes`);

const llmsFull = await fetchAs("/llms-full.txt");
record("llms", "/llms-full.txt is 200 and complete", llmsFull.status === 200 && /Limitations and where it does not fit/.test(llmsFull.text), `${llmsFull.text.length} bytes`);

const sitemap = await fetchAs("/sitemap.xml");
for (const path of ["/faq", "/compare", "/about"]) {
  record("sitemap", `sitemap lists ${path} in every locale`, LOCALES.every((locale) => sitemap.text.includes(`/${locale}${path}`)));
}

// ── Report ───────────────────────────────────────────────────────────────────
let lastArea = "";
for (const result of results) {
  if (result.area !== lastArea) {
    console.log(`\n${result.area.toUpperCase()}`);
    lastArea = result.area;
  }
  console.log(`  ${result.ok ? "PASS" : "FAIL"}  ${result.name}${result.detail ? `  [${result.detail}]` : ""}`);
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed on ${BASE}`);
if (failed.length > 0) {
  console.log("\nFailed:");
  for (const result of failed) console.log(`  - ${result.area}: ${result.name}${result.detail ? ` (${result.detail})` : ""}`);
  process.exit(1);
}
