# Rebuild — "Bone & Ink"

Nothing from the current design survives. The stone/steel palette, the Syne
headlines, the split masthead, the tile-and-card sections — all removed, not
adjusted. This is a new visual language built from a blank page, on a white
theme, starting with the homepage.

## The direction I'm choosing

**Bone & Ink.** Warm off-white paper, pure black type, gold reserved for one
thing only: figures that come from the official Dubai record. It reads like an
architecture monograph — the kind of book you leave on a table, not a website
you scroll past.

- Paper `#F6F3EE`, deeper paper `#E9E3D9`, ink `#0A0A0A`, grey `#7A756D`, gold `#B08D4C`
- Black is used exactly twice on any page as a deliberate inversion — never as a mood
- No cards, no rounded tiles, no shadows, no gradients. Hairlines and space instead

## Typography

**Instrument Serif** for headlines — high-contrast, editorial, sits naturally
beside the DX monogram — with **Work Sans** for everything else. Headlines run
very large and tight; body copy stays small, wide-set and calm. Numbers get
their own treatment: oversized, lined, gold hairline beneath.

## The homepage, rebuilt

Full-bleed cinematic chapters, one per screen, scroll-led. No hero-with-text-on-top.

```text
1  OPENING     Full-screen frame of Dubai at dusk. A single line of type at the
               foot, small. The name, the licence, nothing else. It breathes.
2  STATEMENT   White. One enormous sentence across the full width, set in ink,
               a two-line paragraph offset to the right margin. No image.
3  EVIDENCE    Inverted black chapter. Three official figures, counted up,
               each with a plain-English line underneath and the DLD stamp.
4  PORTFOLIO   Editorial index — oversized numbered rows, each opening a
               full-bleed image on hover. Typographic, not a grid of cards.
5  THE TWO     The two focus off-plan projects, one full screen each, image
               left to edge, facts as a printed schedule on paper.
6  UNDERSTAND  The advisor, introduced as a sentence, not a widget.
7  CLOSING     Inverted black. Large wordmark, one invitation, compliance line.
```

Every scroll transition is a mask reveal, slow and heavy. Reduced-motion turns
all of it off and everything lands in its final state instantly.

## Also rebuilt in this first pass

- **Masthead** — thin paper bar, ink wordmark, menu opens as a full-height
  paper sheet with imagery, closing over the page
- **Footer** — inverted ink block, oversized wordmark, RERA ORN line
- **Buttons, links, forms, figures, charts** — retuned to the new palette
- **Photography** — new cinematic frames shot warm-neutral so they belong to
  the paper, replacing the current set on the homepage

## After you approve the homepage

The same language rolls across the site, and no two page types share a
structure: properties as an asymmetric gallery, property detail with a sticky
facts rail, off-plan as chaptered scroll, market intelligence data-first,
directory as a dense typographic register, areas as map-and-list, services as a
numbered editorial list, about as a portrait grid, contact as a single centred
column, guides as a magazine spread.

## Technical notes

- `src/styles.css` rewritten: new tokens in `@theme inline`, the ink inversion
  as `data-surface="ink"`, all tile/shadow/sheen tokens deleted
- Instrument Serif + Work Sans self-hosted via `scripts/fetch-fonts.mjs`
- New primitives in `src/components/layouts`: `Chapter`, `PaperSheet`,
  `IndexRows`, `FigureBand`, `Schedule`
- New imagery generated to `src/assets/photo/*`, externalised to the CDN
- No changes to the data layer, Supabase, RLS or SEO: every route keeps its
  existing `head()` metadata and JSON-LD
- Fixes carried in passing: the homepage hydration warning and the market chart
  mismatch

## Order of work

1. Tokens, fonts, motion, masthead, footer
2. New homepage photography
3. Homepage, all seven chapters
4. Review with you — then the remaining pages
