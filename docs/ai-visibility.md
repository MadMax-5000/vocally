# AI visibility: getting Anselio recommended by ChatGPT, Claude, Gemini, Perplexity and Grok

This is the working document for "generative engine optimization" (GEO) on anselio.com. It records
what the research actually supports, what was changed in this repository and why, and the routine
that keeps it true.

It is opinionated on purpose. Most GEO advice on the internet is repackaged SEO advice with an
`llms.txt` file bolted on. The parts below are the ones with a mechanism behind them.

---

## 1. What decides whether an assistant names a product

An answer is assembled at request time from four things:

1. **An index the vendor crawled** (Bing for Copilot, Google for AI Overviews/AI Mode, OpenAI's own
   search index, Perplexity's index, Anthropic's search index).
2. **Live retrieval** of a page when a user asks about it.
3. **Model weights** — what the model "remembers" about the brand from training data.
4. **The conversation** — what the user already said, and which tools the assistant has.

Everything below is one of three levers: **be crawlable**, **be quotable**, **be corroborated**.
There is no fourth lever, and no file that shortcuts all three.

Two vendor statements worth knowing, because they bound what is worth doing:

- Google, [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features):
  *"There are no additional requirements to appear in AI Overviews or AI Mode, nor other special
  optimizations necessary."* Access is controlled by `Googlebot` in robots.txt; `Google-Extended`
  controls Gemini training and grounding, not Search. Preview limits are controlled with
  `nosnippet`/`max-snippet`.
- OpenAI, [Overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots): `OAI-SearchBot`
  controls whether a site appears in ChatGPT search answers, `GPTBot` is training only, and
  `ChatGPT-User` is a user-triggered fetch that is *"not used to determine whether content may appear
  in Search"*.

The practical consequence: the crawl policy decides whether you are *eligible*, the page content
decides whether you are *quotable*, and third-party pages decide whether an assistant is *confident
enough* to name you.

---

## 2. Crawl access — what was actually blocking AI answers

The live `https://anselio.com/robots.txt` was not the file in this repository. Cloudflare was
prepending a managed block that disallowed roughly thirty tokens — among them `GPTBot`,
`ClaudeBot`, `anthropic-ai`, `Claude-Web`, `Google-Extended`, `GoogleOther`,
`Google-CloudVertexBot`, `CCBot`, `KimiBot`, `meta-externalagent`, `cohere-ai`,
`MistralAI-Training`, `Applebot-Extended`, `Amazonbot` and `Bytespider`.

That cost two things:

- **Gemini grounding and Gemini training.** `Google-Extended` is the token Google documents for
  "AI training and grounding in some of Google's other systems". Disallowing it removes the site from
  that pipeline; it does *not* affect AI Overviews, which run on `Googlebot`.
- **Presence in model weights.** Training crawlers were blocked, so the brand could not enter future
  models. For a young brand, being in the weights is a real discovery channel: it is why an assistant
  can discuss a product it has never retrieved.

The search crawlers (`OAI-SearchBot`, `PerplexityBot`, `bingbot`) were *not* blocked. So the deeper
problem was not robots.txt — it was §3.

### How Cloudflare causes this

Cloudflare's [managed robots.txt / Bot Preference Sync](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)
prepends directives **only when at least one policy is restrictive**: Search/Agent set to *Block* or
*Block on pages with ads*, or Training set to *Disallow*. With every policy on allow, the origin file
is served unchanged. When it does prepend, it also adds the Content Signals Policy and can enable
edge blocking for training crawlers.

There are two defensible positions. Pick one deliberately:

| Position | Cloudflare setting | Effect |
|---|---|---|
| **A. Open (default in this repo)** | All policies allow, Bot Preference Sync off | Content may train models; maximum chance of being known by name |
| **B. Search yes, training no** | Training: Disallow; Bot Preference Sync on | Answers keep working and the brand still appears via retrieval; no training, no Gemini grounding |

If B is chosen, verify that the managed block leaves the *search* tokens alone. It does today, but
re-check after any Cloudflare change:

```bash
curl -s https://anselio.com/robots.txt | grep -iE "user-agent|allow|disallow"
```

Dashboard path: **Security → Settings → filter "Bot traffic" → Configure AI bot policies**. Note that
robots.txt is a preference, not enforcement; enforcement lives in **AI Crawl Control** (Security →
Bots). Also note Google Search Console may report `Syntax not understood` for `content-signal` lines.
That is expected and does not affect crawling.

### The code

- [`lib/seo/ai-crawlers.ts`](../lib/seo/ai-crawlers.ts) — one registry of every documented token, its
  vendor, its role (`search` / `user` / `training`) and its docs URL. `ALLOW_AI_TRAINING` is the
  single switch; flipping it to `false` disallows only training tokens and leaves answers intact.
- [`app/robots.ts`](../app/robots.ts) — emits every token **by name**, not via the wildcard, so the
  policy survives being merged with a managed file at the edge.

Why by name: when two robots.txt groups match the same agent, crawlers merge them and the most
restrictive rule wins. An explicit `Allow` group does not override a managed `Disallow`, but it does
make the site's intent unambiguous and makes a future audit a one-line diff.

---

## 3. Content: the page that only existed after JavaScript

**This was the biggest finding.** The marketing sections used `ScrollReveal`, which returned `null`
until an `IntersectionObserver` fired. Server-rendered HTML for `/fr` therefore contained the header,
the hero and nothing else — no pricing, no FAQ answers, no security copy, no footer. The text was in
the React payload and appeared only after hydration.

Most AI crawlers do not execute JavaScript, and the ones that can (Googlebot, Bingbot,
`ChatGPT-User`) often do so on a budget, with a timeout, or not at all for a first fetch. A page whose
content is invisible in view-source is, for these systems, a page about nothing.

The fix keeps the animation and moves the hiding into the browser: children always render, and
`ScrollReveal` only arms opacity/transform **after hydration** — and never for elements already on
screen, so there is no flash of hidden copy. See
[`components/marketing/ScrollReveal.tsx`](../components/marketing/ScrollReveal.tsx).

Measured before/after on `/fr` (dev server, raw HTML without executing JS): the page now serves
~1,230 words of marketing copy, including prices, the six home FAQs, security and footer links.

### The rule going forward

> If a crawler that never runs JavaScript cannot read it, it does not exist.

How to check, in ten seconds:

```bash
curl -s https://anselio.com/fr | grep -c "MAD"        # prices present?
curl -s https://anselio.com/fr | grep -o "<h2[^>]*>[^<]*" | head
```

Do not "fix" `ScrollReveal` back into a mount guard. Do not move marketing copy into client-only
components, `dynamic(..., { ssr: false })`, or anything gated on `useEffect` for first paint.

### What makes copy quotable

Assistants quote sentences, not pages. The structure that survives extraction:

- **Answer first, entity first.** The first sentence of an answer must stand alone and name the
  product: "Anselio is an AI customer service platform for Moroccan businesses…" — not "Yes! Great
  question."
- **One idea per paragraph**, 40–80 words. Long paragraphs get truncated mid-thought.
- **Numbers with units and currency**: "2 000 MAD per month excluding 20% VAT", not "affordable".
- **Tables for comparisons.** A criteria-by-criteria table is the format most often lifted into
  "X vs Y" answers.
- **State where the product does not fit.** Counter-intuitive but load-bearing: a page that admits
  limits reads as a source rather than an advert, and it makes the rest of the claims credible.
- **Use the words buyers use**, in all three languages: *service client IA*, *الدارجة*, *chatbot
  darija*, *WhatsApp*, *numéro marocain*, *AI customer service*. Retrieval is still substantially
  lexical; a page that never says "chatbot" will not answer "best chatbot for Morocco".

### Pages added for this

| Page | Why it exists |
|---|---|
| [`/[locale]/faq`](../app/%5Blocale%5D/faq/page.tsx) | Every answer open in HTML, grouped by intent, with `FAQPage` markup. The single best page to be quoted from. |
| [`/[locale]/compare`](../app/%5Blocale%5D/compare/page.tsx) | Category-level comparison (Anselio vs IVR vs international voice AI) with criteria, plus an explicit "where it does not fit" block. No named competitor and no unverifiable claim. |
| [`/[locale]/about`](../app/%5Blocale%5D/about/page.tsx) | Entity facts: operator, location, product category, languages, compliance. Answers "what is X" and "who is X for". |

All three are in the footer, the sitemap and `hreflang` alternates. Content lives in
`messages/{en,fr,ar}.json` under the `faqPage`, `compare` and `about` namespaces — no hardcoded
strings, per the project rules.

### Fact discipline

[`lib/seo/ai-facts.ts`](../lib/seo/ai-facts.ts) is the single source of truth for every claim that
appears in `llms.txt`, the JSON-LD graph and the docs. Prices are imported from the billing
constants, never retyped. `ANSELIO_FACTS.publishedClaims` exists to separate what the company states
from what is measured — an assistant that repeats an inflated number is a liability, and a page is
only citable while it stays true.

When pricing changes, change `PLAN_PRICES` / `phone-addon.ts`. `llms.txt`, `llms-full.txt` and the
`Offer` markup follow automatically.

### `llms.txt` — keep it, do not expect it to rank

`/llms.txt` and `/llms-full.txt` are served from [`lib/seo/llms-files.ts`](../lib/seo/llms-files.ts),
generated at request time. Be honest about what they are:

- **No vendor documents consuming a third-party `llms.txt`.** OpenAI, Anthropic, Google, Perplexity
  and Microsoft publish crawler and search documentation; none of them describe `llms.txt` as an
  input to answers.
- **Crawl logs show a very small share of AI-bot requests touch it** (published log studies find well
  under 1%). It is not a switch.
- It **is** useful when a person or an agent is handed a documentation URL, and it is the one file
  where the canonical facts live in a single fetch.

Cost is near zero and the content is generated from the same constants as the site, so it stays
correct. Treat it as documentation, not as SEO.

---

## 4. Structured data: what it buys, what it does not

Google says plainly that there is *"no special schema.org structured data"* to add for AI features,
and that structured data must match visible text. There is no credible evidence that `FAQPage` or
`SoftwareApplication` markup raises how often an LLM cites a page.

It is still worth doing, for three real reasons:

1. **Entity resolution.** One `@id` per entity, identical `name`/`url`/`logo` across pages, is how a
   machine confirms that anselio.com, the LinkedIn page and the review profile are one company.
2. **Unambiguous facts.** `Offer` prices in `MAD`, `priceCurrency`, `unitCode: MON` — a number a
   retrieval system can lift without parsing French prose.
3. **Eligibility elsewhere.** Rich results in Search still read this markup, and Search feeds AI Mode.

Implemented in [`lib/seo/json-ld.ts`](../lib/seo/json-ld.ts):

- `Organization` (`#organization`) — legal name, address, `knowsLanguage`, contact points.
- `WebSite` (`#website`) — site language set, publisher reference.
- `SoftwareApplication` (`#software`) — `featureList`, `AggregateOffer` from live plan prices.
  Enterprise is deliberately absent from `offers`: it has no published price.
- `FAQPage` **only on `/faq`**, where every answer is visible in HTML.
- `BreadcrumbList` on the new pages.

Deliberately **not** implemented: `AggregateRating` / `Review` (no real reviews yet — inventing them
is both a Google policy violation and an obvious tell), `HowTo` (deprecated by Google), and
keyword-stuffed `mentions`.

**Action when profiles exist:** fill `ANSELIO_FACTS.sameAs` with the LinkedIn, Crunchbase, G2,
Product Hunt and Wikidata URLs. It is the cheapest entity signal available and it flows into the
`Organization` markup automatically.

---

## 5. Off-site: where recommendations actually come from

Retrieval-heavy systems lean on pages *other people* wrote. For "best AI customer service tool for
Morocco" or "WhatsApp chatbot Darija", the answer is usually assembled from review sites, Reddit,
YouTube, listicles and documentation — the vendor's own page is one source among several.

Ranked by expected impact for this product:

1. **Review and directory profiles** — G2, Capterra, GetApp, Software Advice (choose the category
   carefully: "AI customer service" / "chatbot" / "contact center" place you in different shortlists).
   Profile text should reuse the canonical summary sentence.
2. **"Best of" listicles** — pitch 10–15 relevant round-ups ("best AI customer service tools 2026",
   "AI tools for Moroccan SMEs", "WhatsApp automation tools"). Include the facts from
   `/llms-full.txt`; give editors a reason to include you. This is the single most-quoted format.
3. **Reddit and forums** — answer real questions in r/Morocco, r/ecommerce, r/smallbusiness where
   relevant, as a person, with no link unless it answers the question. Assistants weight
   first-person experience heavily.
4. **YouTube** — a 2-minute product demo whose title and description contain "AI customer service
   Morocco" and "Darija", with a transcript. Video pages are retrieved and quoted.
5. **Wikidata / Wikipedia** — a Wikidata item with the official URL, country and industry is
   low-effort and disambiguates the entity. Wikipedia needs independent coverage first; do not
   self-promote there.
6. **Moroccan press and local directories** — pitch product launches to Moroccan tech press and list
   the company in local business directories. Local-language coverage is disproportionately useful
   for Darija/Arabic queries.
7. **Partner and agency pages** — Moroccan web agencies, integrators and Shopify/WordPress partners
   listing Anselio as a recommended tool.

**Ask for specifics in reviews.** Models quote review *text*. "Resolved our Darija WhatsApp questions
in seconds" is quotable; "great product" is not.

**Keep the description identical everywhere.** The one-line summary in `ai-facts.ts` is the canonical
wording — use it verbatim on every profile so the entity does not fragment.

---

## 6. Measurement

### Traffic, in GA4

AI assistants usually arrive with a referrer. Create a custom channel group **"AI Assistants"** with
a source regex:

```
chatgpt\.com|chat\.openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai|grok\.com|you\.com|poe\.com|phind\.com|deepseek\.com|mistral\.ai|chat\.mistral\.ai|meta\.ai
```

Caveats: in-app browsers sometimes strip the referrer, so treat direct traffic that lands on `/faq`
or `/compare` as a possible AI visit, and put `utm_source` on any link you control that may be shared
inside an assistant.

### Search Console

AI Overviews and AI Mode clicks are counted inside the normal **Web** search type; there is no
separate report. Watch impressions and CTR for question-shaped queries (who/what/best/vs/how much).
A rise in impressions with flat clicks is the expected signature of being cited without a click.

### Did the crawlers actually come?

```bash
# Same bytes to a crawler as to a browser?
curl -s -A "Mozilla/5.0; compatible; OAI-SearchBot/1.4" https://anselio.com/en | wc -c
curl -s https://anselio.com/en | wc -c

# Are the AI endpoints alive?
curl -sI https://anselio.com/llms.txt
curl -s https://anselio.com/robots.txt | grep -ci "user-agent"

# Is the copy really in the HTML?
curl -s https://anselio.com/en | grep -c "MAD"
```

On Cloudflare, **Security → Events** and **AI Crawl Control** show bot traffic by token. Server logs
are the other source: grep for `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`.

### The prompt panel (free, and the only real measure)

Once a month, run the same 15–20 prompts in ChatGPT, Claude, Gemini, Perplexity and Grok, signed out,
and log: mentioned? position? cited URL? Track the trend, not a single run — answers are
non-deterministic.

Prompts worth tracking for Anselio:

- best AI customer service software in Morocco
- chatbot that speaks Moroccan Darija
- WhatsApp AI agent for Moroccan e-commerce
- AI phone agent with a Moroccan number
- Anselio vs a traditional IVR
- alternatives to Anselio
- how much does an AI customer service agent cost in Morocco
- AI support tool for a clinic / salon in Casablanca
- Anselio (brand query — does it know what the company does?)

Record the result in a sheet with a date column. Paid tools (Profound, Otterly, Peec, Scrunch, Ahrefs
Brand Radar) automate exactly this and are convenient, not necessary, at this stage.

---

## 7. Runbook

**Before deploying a marketing change**

```bash
npm run typecheck
npm run lint
curl -s http://localhost:3000/fr | grep -c "MAD"      # copy still in HTML
curl -s http://localhost:3000/robots.txt | head -40    # policy unchanged
curl -s http://localhost:3000/llms.txt | head -20      # facts still correct
```

**After deploying**

1. `curl -s https://anselio.com/robots.txt | grep -i "google-extended"` — if a managed block
   reappeared, fix it in Cloudflare (§2).
2. Fetch `/en`, `/fr`, `/ar` and confirm the copy is present without JavaScript.
3. Confirm `/llms.txt`, `/llms-full.txt` return 200 `text/plain`.
4. Run the JSON-LD through the Schema Markup Validator and Rich Results Test.
5. Re-run the prompt panel a week later (indexes lag).

**When prices change**

Edit `PLAN_PRICES` in [`lib/billing/plan-features.ts`](../lib/billing/plan-features.ts) and the phone
add-on constants. Nothing else: the JSON-LD, `llms.txt` and `/faq` read from them.

---

## 8. What not to do

- **Do not block Googlebot or bingbot** in the name of AI protection. That removes you from Search,
  AI Overviews and Copilot at once.
- **Do not cloak** — serving different content to AI bots than to people is detectable and violates
  the policies of every vendor above.
- **Do not fabricate** reviews, ratings, customer counts, awards or benchmarks. One inflated claim
  invalidates the whole page, and competitors can report it.
- **Do not treat `llms.txt` as a ranking hack.** It is documentation.
- **Do not chase volume.** Twenty accurate, quotable answers beat two hundred thin pages; retrieval
  systems select one source, and thin pages lose to specific ones.
- **Do not let marketing copy drift from the pricing constants.** The whole point of `ai-facts.ts` is
  that there is one number.

---

## 9. Sources

- Google Search Central — [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- Google Search Central — [Google crawlers and fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- OpenAI — [Overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots)
- Anthropic — [Does Anthropic crawl data from the web?](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- Perplexity — [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- Microsoft — [Copilot and public websites](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-ai-public-websites)
- Apple — [Applebot and Applebot-Extended](https://support.apple.com/en-us/119829)
- Meta — [Web crawlers](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers)
- Mistral — [robots.txt policy](https://docs.mistral.ai/robots)
- Cloudflare — [Managed robots.txt / Bot Preference Sync](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)
- Cloudflare — [Bot Preference Sync announcement](https://blog.cloudflare.com/bot-preference-sync)
- Common Crawl — [CCBot](https://commoncrawl.org/ccbot)
- DuckDuckGo — [DuckAssistBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot)

*Last verified: 28 October 2026. Crawler tokens and vendor policies change; re-check the vendor docs
before changing the registry.*
