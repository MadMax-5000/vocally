# WordPress deployment

Embed your Vocally AI agent on a WordPress site using the official plugin or manual embed code.

## Prerequisites

1. **Chat widget** enabled (Deploy → Chat widget).
2. Agent **public** and **active**.
3. **WordPress** deployment enabled (Deploy → WordPress).

Copy credentials from **Deploy → WordPress → Setup**:

| Field | Description |
|-------|-------------|
| Vocally App URL | Your dashboard origin, e.g. `https://app.vocally.ai` |
| Agent ID | Unique agent identifier |
| Widget token | Required only if your agent uses a widget access token |

## Option A: Official plugin (recommended)

1. Download **vocally-wordpress.zip** from Setup (or run `npm run build:wordpress-plugin`).
2. In WordPress: **Plugins → Add New → Upload Plugin** → choose the zip → **Activate**.
3. Open **Settings → Vocally** and paste App URL, Agent ID, and token (if any).
4. Choose display mode:
   - **Floating bubble** — chat appears on every front-end page (footer injection).
   - **Shortcode only** — add `[vocally_agent]` to pages or posts where you want chat.
5. Save and view your site (not wp-admin).

### Shortcode

```
[vocally_agent]
[vocally_agent height="720"]
```

## Option B: Manual embed (no plugin)

From **Deploy → WordPress → Embed code**:

- **Floating bubble** — paste the script snippet into a footer injection plugin such as [WPCode](https://wordpress.org/plugins/insert-headers-and-footers/) (footer / body area).
- **Inline iframe** — add a **Custom HTML** block on a page and paste the iframe snippet.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Widget missing on site | App URL and Agent ID filled; agent public + active; chat widget enabled |
| Widget works locally but not production | App URL must match your live Vocally origin (`NEXT_PUBLIC_APP_URL`) |
| 401 / blank widget | Add widget token in plugin settings if the agent requires one |
| Only shows on some pages | Floating mode uses `wp_footer`; theme must call `wp_footer()` |

## Building the plugin zip (developers)

```bash
npm run build:wordpress-plugin
```

Output: `public/downloads/vocally-wordpress.zip`
