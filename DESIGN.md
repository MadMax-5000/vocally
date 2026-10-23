## Overview

ElevenLabs reads like a quietly editorial print magazine that happens to be a voice-AI product. The base canvas is off-white `{colors.canvas}` (#f5f5f5) holding warm near-black ink `{colors.ink}` (#0c0a09). The system operates entirely in light mode — no dark-canvas atmospheres.

Type pairs **Sentient** (display, weight 400) with **Inter** for body, navigation, captions, and buttons. Large display sizes use tight negative letter-spacing (~-0.02em to -0.025em). The landing hero is a full-bleed photographic band with white type — the single approved dark-surface exception. The rest of the product remains light.

CTAs are subtle: a warm-coral button (`{component.button-primary}`) is the primary, a transparent outline (`{component.button-outline}`) is the secondary. The brand trusts typography and whitespace to carry the design.

**Key Characteristics:**
- Light mode by default. Off-white canvas, warm near-black ink. The landing hero is the only dark, photographic surface.
- Single primary action: brand button at `{rounded.md}`.
- Display runs Sentient at weight 400 — tight tracking on large sizes.
- Body runs Inter at 400–500 with subtle letter-spacing (+0.15-0.18px).
- Soft geometry (`{rounded.md}` for buttons, `{rounded.xl}` for cards; pills on dark surfaces).
- 96px section rhythm.

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — #FF5A36): Primary action + highlight color. Used sparingly.
- **Primary Active** (`{colors.primary-active}` — #E84A2C): Press state for primary.
- **Secondary** (`{colors.secondary}` — #00E5FF): Secondary brand accent. Reserved for subtle highlights, badges, and soft emphasis.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on primary surfaces.
- **On Secondary** (`{colors.on-secondary}` — #0c0a09): Ink text on secondary surfaces.

### Surface
- **Canvas** (`{colors.canvas}` — #f5f5f5): Off-white page floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #fafafa): Lighter band for subtle alternating sections.
- **Canvas Warm** (`{colors.canvas-warm}` — #fafbf6): Warm section floor for the redesigned landing sections.
- **Surface Warm** (`{colors.surface-warm}` — #F4F2EC): Warm card floor for the lifecycle cards.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white card.
- **Surface Strong** (`{colors.surface-strong}` — #f0efed): Badges, voice-icon plates, and featured card backgrounds.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e7e5e4): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f0efed): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #d6d3d1): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #0c0a09): Display, primary text.
- **Warm Ink** (`{colors.warm-ink}` — #3F3E3A): Warm display text used by the “Three ways” section.
- **Body** (`{colors.body}` — #4e4e4e): Default running-text.
- **Body Strong** (`{colors.body-strong}` — #292524): Same as primary — emphasis.
- **Muted** (`{colors.muted}` — #777169): Sub-titles.
- **Warm Body** (`{colors.warm-body}` — #5F5B54): Warm captions, subheadings, and secondary copy.
- **Muted Soft** (`{colors.muted-soft}` — #a8a29e): Disabled text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on primary CTAs.

### Semantic
- **Success** (`{colors.semantic-success}` — #16a34a): Confirmation.
- **Error** (`{colors.semantic-error}` — #dc2626): Validation errors.

## Typography

### Font Family
**Sentient** is the display serif at weight 400 (`--font-display`). **Inter** carries body, navigation, captions, buttons, and all subheadings (`--font-body`). **JetBrains Mono** is used for `code`, `pre`, and `kbd` (`--font-mono`). In-app chrome uses `--font-app` (Inter first). All faces are self-hosted via `@font-face` in `public/fonts` — never load fonts from a CDN.

The subheading recipe is fixed: Inter 18px / 27px / 400. On the dark hero it uses `#f5f5f5e0`; on light surfaces it uses `{colors.body}`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-hero}` | 90px | 400 | 99px | -2.4px | Landing hero h1 |
| `{typography.display-mega}` | 56px | 400 | 1.05 | -1.4px | Subsidiary heroes |
| `{typography.display-xl}` | 40px | 400 | 1.08 | -0.8px | Page heroes |
| `{typography.display-lg}` | 30px | 400 | 1.17 | -0.6px | Section heads |
| `{typography.display-md}` | 26px | 400 | 1.13 | -0.52px | Sub-section heads |
| `{typography.display-sm}` | 20px | 500 | 1.2 | -0.4px | Card group titles |
| `{typography.title-md}` | 18px | 500 | 1.35 | 0 | Component titles — Inter |
| `{typography.title-sm}` | 16px | 500 | 1.44 | 0.14px | List labels |
| `{typography.body-md}` | 15px | 400 | 1.55 | 0.14px | Default body — Inter |
| `{typography.body-strong}` | 15px | 500 | 1.55 | 0.14px | Emphasized body |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0.12px | Secondary body |
| `{typography.caption}` | 13px | 400 | 1.5 | 0 | Captions / helper text |
| `{typography.caption-uppercase}` | 12px | 600 | 1.4 | 0.96px | Section labels, badges |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | CTA pill |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu |

### Principles
- **Display weight is 400.** Sentient regular is the brand signature for h1–h4 and wordmarks. Never bold the display face — hierarchy comes from size and whitespace. Use 500 only for card-level headings at 20px or below.
- **Subtle letter-spacing on body.** Inter at +0.15-0.18px tracking.
- **Negative letter-spacing on display.** Landing display headings (hero + section heads) use a fixed **-2.4px** regardless of size; other display tokens use about -0.02em to -0.025em (e.g. -1px at 46px, -1.4px at 58px).

### Note on Font Substitutes
Brand fonts are self-hosted. Sentient falls back to `"Sentient Placeholder", serif`; Inter falls back to `system-ui, sans-serif`; mono falls back to `ui-monospace, monospace`.

### Utility recipes for React (Tailwind)

Use these **together** for a crisp, editorial feel. Prefer design tokens over raw `zinc-*` or arbitrary hex.

- **Display (hero, section heads):** `font-display` with `text-display-*` sizes, `tracking-tighter` (or the token’s built-in letter-spacing), `text-ink`, and `text-balance` on the heading. Display uses **Sentient** at 400 per the hierarchy table.
- **Body / subcopy:** `text-body` or `text-muted`, `leading-relaxed`, `text-pretty`. Keep **subtle positive** body tracking from `{typography.body-*}` — do not put `tracking-tighter` on long body paragraphs.
- **UI / CTAs:** `tracking-wide` on short bold label text; primary actions use `{component.button-primary}` / `bg-primary` + `text-on-primary` + `rounded-md`, or the `.btn-primary` class from global CSS.

**Example (token-aligned hero strip):**

```tsx
export default function HeroSection() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-section">
      <h1 className="font-display text-display-xl md:text-display-mega tracking-tighter text-ink text-balance">
        Replace rigid IVR with conversational AI that resolves issues.
      </h1>
      <p className="mt-6 max-w-2xl text-pretty text-body-md leading-relaxed text-body">
        Omnichannel AI agents, live dashboards with co-pilot assistance, and analytics —
        tuned for Arabic, French, and English.
      </p>
      <button
        type="button"
        className="btn-primary mt-8 tracking-wide"
      >
        Learn more
      </button>
    </main>
  );
}
```

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 72px.
- **Section padding:** 72px.

### Grid & Container
- Max content width: ~1200px.
- Editorial body: 12-column grid.
- Feature card grids: 2-up at desktop for hero splits, 3-up for benefit grids.
- Footer: 5-column at desktop.

### Whitespace Philosophy
Editorial pacing, but product-density defaults. 72px between bands; cards inside bands sit close (12-20px gap).

### Dashboard density (premium)
In-product dashboard UI should feel **clean and premium** by being **denser** than marketing pages. The separation comes from **hairlines, alignment, and typography** — not large padding.

- **Default rhythm**: keep more content above the fold.
  - Prefer `gap-3`/`gap-4` over `gap-6`/`gap-8`
  - Prefer `p-3`/`p-4` over `p-6`
  - Prefer `px-3`/`px-4` over `px-5`/`px-6`
  - Prefer `py-2`/`py-3` over `py-4`

- **Practical mapping (Tailwind)**:
  - **Page wrapper**: `gap-8` → `gap-4`; `gap-6` → `gap-3`; avoid stacking extra `py-*` if the shell already provides padding.
  - **Cards / panels**: `p-6` → `p-4`; `p-5` → `p-4`; `p-4` → `p-3` when content is mostly rows.
  - **Tables**: header `px-4 py-3` → `px-3 py-2`; rows `px-4 py-4` → `px-3 py-2` (or `py-3` if scanning suffers).
  - **Forms**: `space-y-8` → `space-y-5`; field blocks `space-y-2` → `space-y-1.5` (keep label-to-input proximity tight).

- **Guardrails (don’t over-tighten)**:
  - Keep **comfortable input/button heights** and touch targets; reduce the whitespace *around* controls first.
  - If density starts to hurt scanning (tables) or comprehension (forms), step up one notch (e.g. `py-2` → `py-3`).

## Elevation & Depth

The system uses **hairline + soft drop**. Cards float above the off-white canvas via 1px hairlines and a single subtle shadow tier. Atmospheric depth comes from gradient orbs. No dark-mode depths or elevated dark surfaces exist.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#f5f5f5) | Body bands, footer |
| Card | `{colors.surface-card}` (#ffffff) | Content cards |
| Hairline border | 1px `{colors.hairline}` | Card outlines |
| Soft drop | `0 4px 16px rgba(0, 0, 0, 0.04)` | Hovered cards (single shadow tier) |

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved |
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.lg}` | 12px | Compact cards |
| `{rounded.xl}` | 16px | Feature cards, pricing tiers |
| `{rounded.xxl}` | 24px | Extra-soft hero containers / feature panels |
| `{rounded.pill}` | 9999px | All CTA buttons, badges |
| `{rounded.full}` | 9999px | Voice icon circles, avatars |

## Components

### Top Navigation

**`top-nav`** — Two variants.

- **Solid** (pricing, contact, legal): background `{colors.canvas}`, text `{colors.ink}`, 64px. Logo mark only (no wordmark), center links, Sign in + Book a demo right.
- **Overlay** (landing): transparent, absolute over the hero photograph. Large white logo mark only, white center links (Pricing / Features / Customers), a plain-text **Book a demo** link (no border, no fill), and a solid white **Try free** pill. Signed-in users see a white **Dashboard** pill plus the Clerk avatar. The language switcher is intentionally absent from the landing nav. The nav is not sticky — it scrolls away with the hero.

### Buttons

**`button-primary`** — Terracotta button. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (14px / 500), padding 4px × 12px, height 32px, rounded `{rounded.md}`.

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-outline`** — Transparent outline button with 1px ink border. Background transparent, text `{colors.ink}`, 1px `{colors.hairline-strong}` border, rounded `{rounded.md}`.

**`button-tertiary-text`** — Inline ink text link.

### Hero & Atmospheric

**`hero-band`** — Full-bleed photographic hero (`/images/hero-background.png`) at `min-h-[100svh]`, with layered dark scrims for contrast. Centered display headline in `{typography.display-hero}` (90px / 400 / 99px / -1.8px), subhead in the hero subheading recipe (Inter 20/30/400, `#f5f5f5e0`, one line on desktop), and a single white `Try free` pill.

**`audio-waveform-card`** — A waveform visualization card. Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 24px. Holds a play button + waveform glyph + voice metadata.

### Cards

**`feature-card`** — 2-up or 3-up grids. Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.xl}`, padding 24px, 1px hairline border.

**`product-card-stack`** — Stacked product preview cards. Background `{colors.surface-card}`, rounded `{rounded.xl}`, no padding (children fill the card edge-to-edge).

**`ways-card`** — Three-up capability cards on a full-bleed art background (`/images/cards-background.webp`, 24px radius, 9:8 portrait). The artwork is cropped with a per-card `object-position` so one painting reads as three compositions. Each card holds a frosted-glass panel: a translucent white frame band (35% white, `backdrop-blur-md`, 1px `rgba(255,255,255,0.55)` border, 20px radius, 6px padding) wrapping a near-opaque warm-white surface (`#FCFBF8`, 15px radius, 12px padding) with a soft low-opacity shadow. Captions sit outside the artwork — title in Sentient 17px pure black, body in Inter 14/1.5 `{colors.warm-body}`. The section uses a 1476px container so the cards read a beat larger than the rest of the page. Used by the landing “Three ways Anselio runs your support” section.

**`lifecycle-card`** — Sticky-stacked step card, 1040px max width. Floor `{colors.surface-warm}` (#F4F2EC), 24px radius, 12–16px inner padding. Two columns at `lg`: left is an inset 16px art panel (`/images/cards-background.webp`, per-step `object-position`) holding the step visual inside the shared frosted panel; right is the step copy — heading in Sentient 40/43, −0.8px, pure black; body in Inter 20/30/400 `{colors.warm-body}`; black 40px “Get started” button. Cards stack with `md:sticky` and a 12px peek offset. Used by the landing “One inbox. Every question, handled.” section.

**`landing-section-warm`** — The standard template for the redesigned landing sections: floor `{colors.canvas-warm}` (#fafbf6), section heading in Sentient 38px mobile / 52px desktop, pure black, letter-spacing −2.4px, with an optional muted second line in `{colors.warm-body}` (#5F5B54), secondary and caption copy in `{colors.warm-body}`, 72px vertical padding, and a 1200px container (the ThreeWays section widens to 1476px for larger cards). Reuse this shell for every new section added below the hero.

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.xl}`, padding 32px.

### Voice Library

**`voice-row`** — Horizontal row in voice list. Background transparent, 1px hairline divider. Layout: 32px circular voice icon (`{component.voice-icon-circular}`) left, voice name + accent stack, optional preview button right.

**`voice-icon-circular`** — Background `{colors.surface-strong}`, rounded `{rounded.full}`, 32px diameter. Holds initials or voice glyph.

### Pricing

**`pricing-tier-card`** — Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 32px, 1px hairline border.

**`pricing-tier-featured`** — Featured tier highlight. Background `{colors.surface-strong}`, text `{colors.ink}`. Same shape, but accented with a bold 2px `{colors.ink}` border to stand out against standard tiers without needing dark mode inversion.

### Forms & Tags

**`text-input`** — Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.md}` (8px), padding 8px × 12px, height 40px, 1px `{colors.hairline-strong}` border. On focus, border thickens to 2px ink.

**`badge-pill`** — Background `{colors.surface-strong}`, text `{colors.ink}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 10px.

### Pill Badges

Pills used for tags like status, labels, recommendations, and feature highlights across the UI. Keep the structure **identical** across variants — only change colors.

#### SUCCESS / POSITIVE
- Palette: `bg-emerald-50` · `text-emerald-700` · `ring-emerald-100`

```tsx
<span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-[2px] text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
  Success
</span>
```

#### BRAND / RECOMMENDED
- Palette: `bg-primary/10` · `text-primary` · `ring-primary/20`

```tsx
<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-[2px] text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
  Recommended
</span>
```

#### WARNING / CAUTION
- Palette: `bg-amber-50` · `text-amber-800` · `ring-amber-100`

```tsx
<span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-[2px] text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-100">
  Warning
</span>
```

#### ERROR / DANGER
- Palette: `bg-rose-50` · `text-rose-700` · `ring-rose-100`

```tsx
<span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-[2px] text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
  Error
</span>
```

#### INFO / NEUTRAL
- Palette: `bg-slate-50` · `text-slate-700` · `ring-slate-200`

```tsx
<span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-[2px] text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
  Info
</span>
```

#### PREMIUM / FEATURED
- Palette: `bg-violet-50` · `text-violet-700` · `ring-violet-100`

```tsx
<span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-[2px] text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100">
  Premium
</span>
```

### CTA / Footer

**`cta-band`** — Pre-footer. Background `{colors.canvas}`, centered display headline in `{typography.display-lg}`, single primary pill CTA. 72px padding.

**`footer`** — Closing footer. Background `{colors.canvas}`, text `{colors.body}`. 5-column link list. 64×48px padding.

**`footer-link`** — Background transparent, text `{colors.body}`, type `{typography.body-sm}`.

## Do's and Don'ts

### Do
- Keep the product light; the photographic landing hero is the only dark surface.
- Reserve `{colors.primary}` (brand pill) for primary CTAs on light surfaces.
- Use Sentient at weight 400 for every display headline and wordmark.
- Use Inter at +0.15-0.18px tracking for body — the editorial dialect.
- Use `{rounded.md}` for light-surface CTAs, `{rounded.pill}` for overlay CTAs and badges.

### Don't
- **Don't introduce dark canvases outside the landing hero.**
- Don't bold the display face — Sentient stays at 400 (500 max below 20px).
- Don't introduce a saturated brand action color. Ink pill is the only light-surface CTA color.
- Don't use sharp `{rounded.none}` (0px) on CTAs.
- Don't drop body Inter weight to match display — body stays at 400/500 for legibility.
- Don't extract a CTA color from a third-party widget (cookie consent, OneTrust). The brand's CTA color is what appears on actual product CTAs.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 42/48px; feature cards 1-up; nav hamburger. |
| Tablet | 640–1024px | Hero h1 64/71px; feature cards 2-up. |
| Desktop | 1024–1280px | Full hero h1 90/99px; feature cards 3-up. |
| Wide | > 1280px | Content caps at 1200px. |

### Touch Targets
- Primary pill at 40px height — at WCAG AA, padded for AAA.
- Voice icon circles 32px — padded row creates effective 48px tap zone.

### Collapsing Strategy
- Top nav switches to hamburger below 768px.
- Feature grid: 3-up → 2-up → 1-up.

## Iteration Guide

1. Focus on a single component at a time.
2. CTAs default to `{rounded.md}`. Cards use `{rounded.xl}` (16px).
3. Variants live as separate entries.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state never documented.
6. Sentient 400 for display, Inter 400–500 for body, JetBrains Mono for code.
7. Keep decoration minimal and non-distracting.

## Known Gaps

- Brand fonts are self-hosted (Sentient via Fontshare, Inter via next/font). Bricolage and Instrument Sans files remain in `public/fonts` but are no longer referenced.
- Animation timings (orb drift, waveform pulse, hero entrance) out of scope.
- In-product surfaces (voice library editor, agent playground) only partially captured via marketing mockups.
- Form validation states beyond focus not visible on captured surfaces.
