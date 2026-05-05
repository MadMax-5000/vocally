## Overview

ElevenLabs reads like a quietly editorial print magazine that happens to be a voice-AI product. The base canvas is off-white `{colors.canvas}` (#f5f5f5) holding warm near-black ink `{colors.ink}` (#0c0a09). The system operates entirely in light mode — no dark-canvas atmospheres.

Type pairs **Nimbus Sans L** (modern sans-serif at bold weight) for display with **Inter** for body, navigation, captions. The bold display weight is the modern signature.

CTAs are subtle: a warm-coral pill (`{component.button-primary}`) is the primary, a transparent outline (`{component.button-outline}`) is the secondary. The brand trusts typography and whitespace to carry the design.

**Key Characteristics:**
- Strictly light mode. Off-white canvas, warm near-black ink. No dark canvas surfaces.
- Single primary action: brand pill at `{rounded.pill}`.
- Display runs Nimbus Sans L at bold weight — modern sans-serif hero voice.
- Body runs Inter at 400 with subtle letter-spacing (+0.15-0.18px).
- Soft pill geometry (`{rounded.pill}` for CTAs, `{rounded.xl}` for cards).
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
- **Surface Card** (`{colors.surface-card}` — #ffffff): Pure white card.
- **Surface Strong** (`{colors.surface-strong}` — #f0efed): Badges, voice-icon plates, and featured card backgrounds.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e7e5e4): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f0efed): Lighter divider.
- **Hairline Strong** (`{colors.hairline-strong}` — #d6d3d1): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #0c0a09): Display, primary text.
- **Body** (`{colors.body}` — #4e4e4e): Default running-text.
- **Body Strong** (`{colors.body-strong}` — #292524): Same as primary — emphasis.
- **Muted** (`{colors.muted}` — #777169): Sub-titles.
- **Muted Soft** (`{colors.muted-soft}` — #a8a29e): Disabled text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on primary CTAs.

### Semantic
- **Success** (`{colors.semantic-success}` — #16a34a): Confirmation.
- **Error** (`{colors.semantic-error}` — #dc2626): Validation errors.

## Typography

### Font Family
**Nimbus Sans L** is the display sans-serif at bold weight. **Inter** carries body, navigation, captions, and buttons. Fallback: `'Helvetica', sans-serif` for Nimbus Sans L, `sans-serif` for Inter.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 64px | Bold | 1.05 | -1.92px | Homepage hero h1 |
| `{typography.display-xl}` | 48px | Bold | 1.08 | -0.96px | Subsidiary heroes |
| `{typography.display-lg}` | 36px | Bold | 1.17 | -0.36px | Section heads |
| `{typography.display-md}` | 32px | Bold | 1.13 | -0.32px | Sub-section heads |
| `{typography.display-sm}` | 24px | Bold | 1.2 | 0 | Card group titles |
| `{typography.title-md}` | 20px | 500 | 1.35 | 0 | Component titles — Inter |
| `{typography.title-sm}` | 18px | 500 | 1.44 | 0.18px | List labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0.16px | Default body — Inter |
| `{typography.body-strong}` | 16px | 500 | 1.5 | 0.16px | Emphasized body |
| `{typography.body-sm}` | 15px | 400 | 1.47 | 0.15px | Footer body |
| `{typography.caption}` | 14px | 400 | 1.5 | 0 | Photo captions |
| `{typography.caption-uppercase}` | 12px | 600 | 1.4 | 0.96px | Section labels, badges |
| `{typography.button}` | 15px | 500 | 1.0 | 0 | CTA pill |
| `{typography.nav-link}` | 15px | 500 | 1.4 | 0 | Top-nav menu |

### Principles
- **Display weight stays Bold.** Nimbus Sans L at a bold weight is the modern signature. Never use light weights for display copy.
- **Subtle letter-spacing on body.** Inter at +0.15-0.18px tracking — slightly looser than default Inter for a more editorial feel.
- **Negative letter-spacing on display.** Nimbus Sans L pulls -0.32px to -1.92px tighter on display sizes.

### Note on Font Substitutes
Nimbus Sans L is an open-source typeface (URW++). Common system substitutes: **Helvetica**, **Arial**, or **San Francisco** at bold weight. Use Inter directly for body.

### Utility recipes for React (Tailwind)

Use these **together** for an ElevenLabs-style crisp, editorial feel. Prefer design tokens over raw `zinc-*` or arbitrary hex.

- **Display (hero, section heads):** `font-display` with `text-display-*` sizes, `tracking-tighter` (or the token’s built-in letter-spacing), `text-ink`, and `text-balance` on the heading. Display uses **Nimbus Sans L** at bold per the hierarchy table.
- **Body / subcopy:** `text-body` or `text-muted`, `leading-relaxed`, `text-pretty`. Keep **subtle positive** body tracking from `{typography.body-*}` — do not put `tracking-tighter` on long body paragraphs.
- **UI / CTAs:** `tracking-wide` on short bold label text; primary actions use `{component.button-primary}` / `bg-primary` + `text-on-primary` + `rounded-pill`, or the `.btn-primary` class from global CSS.

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
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** 96px.

### Grid & Container
- Max content width: ~1200px.
- Editorial body: 12-column grid.
- Feature card grids: 2-up at desktop for hero splits, 3-up for benefit grids.
- Footer: 5-column at desktop.

### Whitespace Philosophy
Generous editorial pacing — print-magazine feel. 96px between bands; cards inside bands sit close (16-24px gap).

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

**`top-nav`** — Background `{colors.canvas}`, text `{colors.ink}`, height 64px. Layout: ElevenLabs wordmark left, primary horizontal menu (Creative / Agents / Video / Pricing / Enterprise / Docs), Sign In + "Try free" primary CTA right.

### Buttons

**`button-primary`** — Terracotta pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (15px / 500), padding 10px × 20px, height 40px, rounded `{rounded.pill}`.

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-outline`** — Transparent pill with 1px ink border. Background transparent, text `{colors.ink}`, 1px `{colors.hairline-strong}` border.

**`button-tertiary-text`** — Inline ink text link.

### Hero & Atmospheric

**`hero-band`** — Background `{colors.canvas}`, full-width centered display headline in `{typography.display-mega}` (64px / Bold / -1.92px), subhead in `{typography.body-md}`, and two CTAs.

**`audio-waveform-card`** — A waveform visualization card. Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 24px. Holds a play button + waveform glyph + voice metadata.

### Cards

**`feature-card`** — 2-up or 3-up grids. Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.xl}`, padding 24px, 1px hairline border.

**`product-card-stack`** — Stacked product preview cards. Background `{colors.surface-card}`, rounded `{rounded.xl}`, no padding (children fill the card edge-to-edge).

**`testimonial-card`** — Quote card. Background `{colors.surface-card}`, text `{colors.body}`, rounded `{rounded.xl}`, padding 32px.

### Voice Library

**`voice-row`** — Horizontal row in voice list. Background transparent, 1px hairline divider. Layout: 32px circular voice icon (`{component.voice-icon-circular}`) left, voice name + accent stack, optional preview button right.

**`voice-icon-circular`** — Background `{colors.surface-strong}`, rounded `{rounded.full}`, 32px diameter. Holds initials or voice glyph.

### Pricing

**`pricing-tier-card`** — Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 32px, 1px hairline border.

**`pricing-tier-featured`** — Featured tier highlight. Background `{colors.surface-strong}`, text `{colors.ink}`. Same shape, but accented with a bold 2px `{colors.ink}` border to stand out against standard tiers without needing dark mode inversion.

### Forms & Tags

**`text-input`** — Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.md}` (8px), padding 12px × 16px, height 44px, 1px `{colors.hairline-strong}` border. On focus, border thickens to 2px ink.

**`badge-pill`** — Background `{colors.surface-strong}`, text `{colors.ink}`, type `{typography.caption-uppercase}`, rounded `{rounded.pill}`, padding 4px × 10px.

### CTA / Footer

**`cta-band`** — Pre-footer. Background `{colors.canvas}`, centered display headline in `{typography.display-lg}`, single primary pill CTA. 96px padding.

**`footer`** — Closing footer. Background `{colors.canvas}`, text `{colors.body}`. 5-column link list. 64×48px padding.

**`footer-link`** — Background transparent, text `{colors.body}`, type `{typography.body-sm}`.

## Do's and Don'ts

### Do
- Ensure the interface remains strictly light mode at all times.
- Reserve `{colors.primary}` (brand pill) for primary CTAs.
- Use Nimbus Sans L at bold weight for every display headline. Always bold.
- Use Inter at +0.15-0.18px tracking for body — the editorial dialect.
- Use the pill shape for every CTA and badge.

### Don't
- **Don't introduce dark mode sections, dark canvases, or inverted dark themes.**
- Don't introduce a saturated brand action color. Ink pill is the only CTA color.
- Don't use light weights for display copy. Display sits at bold weight — making it light shifts the brand voice away from its modern punch.
- Don't use sharp `{rounded.none}` (0px) on CTAs. Pill geometry is the brand button.
- Don't drop body Inter to match Nimbus Sans L's bold weight — body stays at 400/500 for legibility.
- Don't extract a CTA color from a third-party widget (cookie consent, OneTrust). The brand's CTA color is what appears on actual product CTAs.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 64→32px; feature cards 1-up; nav hamburger. |
| Tablet | 640–1024px | Hero h1 48px; feature cards 2-up. |
| Desktop | 1024–1280px | Full hero h1 64px; feature cards 3-up. |
| Wide | > 1280px | Content caps at 1200px. |

### Touch Targets
- Primary pill at 40px height — at WCAG AA, padded for AAA.
- Voice icon circles 32px — padded row creates effective 48px tap zone.

### Collapsing Strategy
- Top nav switches to hamburger below 768px.
- Feature grid: 3-up → 2-up → 1-up.

## Iteration Guide

1. Focus on a single component at a time.
2. CTAs default to `{rounded.pill}`. Cards use `{rounded.xl}` (16px).
3. Variants live as separate entries.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state never documented.
6. Nimbus Sans L bold for display, Inter 400/500 for body.
7. Keep decoration minimal and non-distracting.

## Known Gaps

- Nimbus Sans L is open-source, but Helvetica/Arial are documented system substitutes if unavailable.
- Animation timings (orb drift, waveform pulse, hero entrance) out of scope.
- In-product surfaces (voice library editor, agent playground) only partially captured via marketing mockups.
- Form validation states beyond focus not visible on captured surfaces.
