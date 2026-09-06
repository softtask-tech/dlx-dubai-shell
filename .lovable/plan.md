# DLX Properties — Complete Redesign

A ground-up redesign of every page, not a restyle. New colour world, new typefaces, new page architecture, new components.

## The new look

- **Midnight & Brass** — near-black canvas (#0B0B0C), ivory type (#F7F5F1), warm brass accent (#B08D4C), grey (#8A8A8A) for quiet detail. Gallery-at-night, not a document.
- **Syne** for headlines (distinctive, design-studio), **Plus Jakarta Sans** for body.
- **Bento intelligence layout** — modular tiles that mix data, imagery, and actions, so market numbers and property photography share one confident surface instead of stacking as blog-like sections.

## What changes on every page

1. **Foundations** — replace the colour, type, spacing, radius, border and shadow tokens; new elevation/surface system for dark tiles; brass used sparingly as the single accent. Buttons, inputs, cards, badges and tabs all get new variants.
2. **New shell** — a redesigned header (compact, sticky, brass underline navigation, language + contact rail) and a redesigned footer (multi-column, RERA ORN 40905, trade licence, offices, legal).
3. **New component library** — bento tile, stat tile, data tile with self-drawing chart, editorial image tile, quote tile, CTA tile, listing card, section header. These replace the current stacked blocks.
4. **Homepage** — cinematic full-bleed hero over a bento grid: market pulse, featured off-plan (Azizi Florence, Sobha City), why Dubai, advisor moment, proof band, guides.
5. **Every other route rebuilt on the same system** — properties, off-plan, projects (incl. the two featured projects), areas, developers, directory, market intelligence, guides, blog, reports, tools, services, about, team, contact, landing pages, admin shell, privacy/unsubscribe.
6. **Motion** — reveal-on-scroll, count-up numbers, self-drawing charts, gentle parallax, page transitions; all disabled cleanly under reduced-motion.
7. **Responsive + a11y** — bento collapses to a single-column rhythm on mobile; contrast checked against the dark canvas throughout.

## Phase continuity

Alongside the redesign I continue the agreed phases: the two featured off-plan projects (Azizi Florence, Sobha City) get full detail pages with galleries, payment plans and lead capture; the DLD directory and market intelligence surfaces are re-presented as bento data tiles; every form/tool/chat keeps feeding the single lead pipeline.

## Technical notes

- Tokens rewritten in `src/styles.css` (`@theme inline`), fonts self-hosted via `public/fonts` and preloaded in `src/lib/fonts.ts`.
- New primitives in `src/components/ui/*`, new site blocks in `src/components/site/*`; obsolete blocks removed rather than left orphaned.
- Each route keeps its own `pageHead()` — unique title, description, OG image, JSON-LD — and stays in `SITE_PAGES`.
- No data-layer or RLS changes; Supabase queries and RPCs stay as they are.

## Still needed from you

Headshots for the team, the advertising permit numbers for Azizi Florence and Sobha City, and the Fish Audio key. I build around them meanwhile.
