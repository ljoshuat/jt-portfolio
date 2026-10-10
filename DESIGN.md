# DESIGN.md: JT Creative (jtcreative.design)

The design system behind Josh Turner's portfolio. Use it when building or
changing anything on this site, when rebuilding it in Astro, or as the starting
design system for a new project in Claude Design.

Values come from the live site's compiled Webflow CSS (snapshot taken
2026-10-09) and the GSAP/Lenis scripts in this repo. Where Webflow and the code
disagree, the live CSS wins.

---

## 1. Visual theme

Dark, editorial and loud in a few places. A near-black canvas, one acid-lime
accent, huge wide uppercase display type, and quiet grotesk body copy. Most of
the page is calm and the motion does the talking: a counter loader, page
wipes, scroll reveals, a cursor trail and playful hover moments.

- Confident, not busy. One accent color, used for emphasis only.
- Big type contrast. Druk Wide display against light Neue Montreal text.
- Artwork first. Project images are never cropped; galleries show each piece at
  its real shape.
- Rounded containers (16 to 28px) soften the hard type.

## 2. Color

Three themes switch with a class on `<body>`: dark is the default (no class),
`light-theme` and `vibe-theme`. The choice is saved in `localStorage` under
`site-mode`. Always use the variables, never raw hex, so all three themes work.

| Token | Dark (default) | Light | Vibe |
|---|---|---|---|
| `--color--bg-primary` | `#0A0F12` | `#F7F7F7` | `#DAF40A` |
| `--color--bg-secondary` | `#0A0F12` | `#FFFFFF` | |
| `--color--text-primary` | `#F7F7F7` | `#0A0F12` | `#0A0F12` |
| `--color--text-gray` | `#A7A7A7` | `#0A0F12` | `#0A0F12` |
| `--color--text-muted` | `#7D7D7D` | `#C2C2C2` | `#9CB30A` |
| `--color--accent` | `#DAF40A` (lime) | `= text-primary` | `#0A0F12` |
| `--color--border-primary` | `#FFFFFF` | | |

Notes:
- **The lime is `#DAF40A`.** One older head snippet uses `#E3FF00` as a
  fallback. Treat `#DAF40A` as the brand value.
- In light mode the accent turns to ink, so lime never sits on a white
  background.
- Vibe mode makes the whole page lime with ink type.
- Dark overlays use the background ink at opacity: `rgba(10, 15, 18, .15 / .3 / .45 / .6)`.

## 3. Typography

| Role | Family | Weights | Source |
|---|---|---|---|
| Display (headings, hero, loader, stats) | **Druk Wide Web**, fallback Verdana | 500, 700 | Self-hosted woff2 |
| Primary / UI / nav | **PP Neue Montreal** (`Ppneuemontreal`), fallback Arial | 300, 400, 500 | Self-hosted woff2 |
| Serif accent (italic highlights, filter "serif" item) | **PP Editorial New** Ultralight Italic | 200 italic | Self-hosted woff2 |
| Paragraphs (`p`) | **aktiv-grotesk** / aktiv-grotesk-thin | 400 | Adobe Fonts kit `azb1goh` |
| Wide variable (`--typography--font-wide`) | normalidad-wide | | Adobe Fonts kit |
| Defined but rarely used | Schabo Condensed | 400 | Self-hosted woff2 |

Rules:
- Display type is **uppercase**, mostly weight 700 (the loader counter uses 400), line-height about 1.
- Nav and labels are uppercase, small, and tracked: nav `.08em` at weight 300;
  meta labels `.05em`.
- Body line-height is 1.1 on `body` and 1.4 on paragraphs and quotes.
- Body copy is gray (`--color--text-gray`), not full white.

Type scale (all fluid):

| Token | Value |
|---|---|
| `--typography--type-hero` | `clamp(2rem, 1.25rem + 3.75vw, 5rem)` |
| `--typography--type-h1` | `clamp(1.5rem, 4vw, 3.5rem)` |
| `--typography--type-h2-lg` | `clamp(1.25rem, 3.8vw, 3rem)` |
| `--typography--type-h2` | `clamp(1.75rem, 3vw, 2.5rem)` |
| `--typography--type-h2-sm` | `clamp(1.6rem, 2.6vw, 2.2rem)` |
| `--typography--type-h3` | `clamp(1.5rem, 2.2vw, 2rem)` |
| `--typography--type-body-lg` | `clamp(1.6rem, 2.6vw, 2.2rem)` |
| `--typography--type-body-med` | `clamp(1.25rem, 2.25vw, 1.75rem)` |
| `--typography--type-body-med-sm` | `clamp(1.125rem, 1.05rem + .35vw, 1.375rem)` |
| `--typography--type-body` | `clamp(1rem, .969rem + .156vw, 1.125rem)` |
| `--typography--type-small` | `clamp(.875rem, .9vw, .95rem)` |
| `--typography--type-xsmall` | `clamp(.75rem, .8vw, .85rem)` |

## 4. Spacing, radius and layout

Spacing (fluid):

| Token | Value |
|---|---|
| `--spacing--space-xxs` | `clamp(.25rem, .5vw, .125rem)` |
| `--spacing--space-xs` | `clamp(.5rem, 1vw, .75rem)` |
| `--spacing--space-sm` | `clamp(1rem, 2vw, 1.5rem)` |
| `--spacing--space-md` | `clamp(1.5rem, 3vw, 2.5rem)` |
| `--spacing--space-lg` | `clamp(2rem, 4vw, 3.5rem)` |
| `--spacing--space-xl` | `clamp(4rem, 8vw, 6rem)` |
| `--spacing--space-xxl` | `clamp(6rem, 12vw, 8rem)` |
| `--spacing--space-xxxl` | `clamp(8rem, 16vw, 12rem)` |
| `--spacing--hero-spacing` | `clamp(6rem, 12vw, 10rem)` |
| `--spacing--page-padding` | `clamp(1.25rem, 4vw, 3rem)` (side gutter everywhere) |

Radius: `--spacing--radius-sm` `clamp(6px, .6vw, 10px)`, `-md` `clamp(16px, 1.2vw, 20px)`,
`-lg` `clamp(16px, 2vw, 28px)`. Sections such as logos and testimonials sit in
`-lg` rounded panels. Media and buttons use `-md`.

Layout: containers are `1320px` (default), `1600px` (med) and `1800px` (wide).
Hero logo width is `clamp(3rem, 10vw, 8rem)`. The home rings use container
units (`cqw`).

Breakpoints (Webflow): 1440px and up, base desktop, 991px tablet, 767px
landscape phone, 479px phone.

## 5. Components

- **Primary button (`.work-button`)**: lime fill, ink text, uppercase Neue
  Montreal 700, `-md` radius, 2px border. On hover it inverts to ink fill with
  lime text and border over `.35s`.
- **Glass play button**: a round lime-glass circle with a rounded play icon
  (`portfolio/play-glass/play-glass.css` in project files).
- **Menu**: a full-screen panel that slides in from the left
  (`margin .75s cubic-bezier(.215, .61, .355, 1)`). Items turn lime on hover.
- **Loader**: a full-screen ink panel with a large counter in display type and
  the logo, then an exit takeover into the hero.
- **Page transition**: a full-screen panel that slides up with the logo
  centered. Barba handles routing.
- **Work filter**: a sticky bar with uppercase items. The active item is lime,
  the serif item is Editorial New italic, and thin 25%-opacity dividers sit
  between items.
- **Meta labels**: tiny uppercase gray labels over primary-color values.
- **Testimonials**: a lime oversized quote mark, Neue Montreal quote text, and
  italic lime highlights.
- **Cursor trail**: a desktop-only custom cursor with size, scale and opacity
  variables.

## 6. Motion

Stack: GSAP + ScrollTrigger, Barba for page transitions, Lenis smooth scroll
(`lerp: 0.1`).

Easing:
- Default for entrances and reveals: `power3.out`. Use `power2.out` for
  lighter fades.
- Big moves such as the loader slide and takeover: `power4.inOut`.
- Scrubbed scroll: `none`.
- The CSS equivalent for UI slides is `cubic-bezier(.215, .61, .355, 1)`.
- Only one deliberate overshoot is used: `back.out(2.5)`. Keep overshoot rare.

Duration tiers:

| Kind | Duration |
|---|---|
| Hover / color change | `.3s` to `.35s` |
| UI reveals, fades, filter changes | `0.45s` to `0.6s` |
| Section reveals | `0.8s` |
| Signature moments (loader, takeover) | `1.3s` to `1.7s` |

Staggers: letters `0.018` to `0.025`s, items `0.04` to `0.06`s.

Principles:
- Motion is the signature. It should feel smooth and confident, never bouncy
  or random.
- Rare moments such as the first load and page changes can be big. Things
  people do often, such as hovers and filters, stay quick.
- Move with transform and opacity only.
- Respect `prefers-reduced-motion`. Several scripts (Lenis, cursor trail, text
  roll, view more, work filter, snippets) already check it. The Webflow CSS and
  head code do not yet, so check any new or ported animation.
- On mobile, skip heavy scale-ups in favor of simple fades. The work hero
  already does this.

## 7. Do and don't

Do:
- Use the variables so all three themes work.
- Keep display type uppercase and wide, and body copy light and gray.
- Use lime for one point of emphasis per view.
- Show artwork uncropped.

Don't:
- Put lime text on the light theme. The accent maps to ink there for that
  reason.
- Add new accent colors, gradients or drop shadows. Depth comes from type and
  motion.
- Blur-in every element, or animate things people trigger often.
- Fill empty CMS fields. Empty fields are hidden on purpose.

## 8. Notes for the Astro rebuild

- Port the `:root`, `.light-theme` and `.vibe-theme` variable blocks as they
  are. The token names above are the CSS custom property names, so components
  can keep using them.
- Self-host Druk Wide, Neue Montreal and Editorial New (their woff2 files are
  in Webflow assets). aktiv-grotesk and normalidad-wide come from an Adobe Fonts
  kit, so either keep the kit or replace them.
- Keep GSAP + ScrollTrigger and Lenis. Barba can be replaced by Astro view
  transitions, but match the panel-up wipe and its timing.
