# Complete Redesign — "Marble & Ink"

You are right: the last pass changed the surface, not the design. This is a
rebuild of the whole visual language — new palette, new type, new photography,
and a different composition for every page. Nothing is carried over except the
brand mark and the data.

## The direction

**Marble & Ink.** A cool off-white stone canvas with pure black type and a muted
steel-blue accent, warmed by one brass hairline reserved for numbers that come
from the official record. It reads like an architecture monograph, not a
property portal — and it is the opposite of the dark canvas you have now.

- Canvas `#F2F2F0`, stone panels `#D9D9D6`, ink `#0A0A0A`, accent `#3E5C6B`
- Headlines in **Syne** (architectural, wide, confident), body in **Plus Jakarta Sans**
- Dark is used only twice per page as a deliberate inversion — the market data
  band and the closing invitation — so black becomes an event rather than a mood

## New photography

Every current image is replaced. Cinematic Dubai from angles the portals do not
use: dusk water level across the marina, a single tower facade in raking light,
the interchange from directly overhead, a terrace edge against haze, marble and
brass detail at close range. Shot warm-neutral so they sit inside the stone
palette instead of fighting it. Roughly 14 new images, generated at hero
resolution and served from the CDN.

## The hero — rebuilt

The current hero is a dark photo with text dumped on it. The new one is a
**split masthead**: the left two-thirds is a full-height cinematic frame that
scales slowly on load; the right third is a stone panel carrying the statement,
one sentence, one action, and a live strip of three official figures with their
Dubai Land Department stamp. The type sits *beside* the photograph, not on top
of it — which is what makes it read as designed rather than layered.

## Every page gets its own composition

This is the point you raised. One layout repeated eleven times is why it felt
unchanged. The rule: **no two page types share a structure.**

| Page | Structure |
| --- | --- |
| Home | Split masthead → evidence bento → editorial index → inverted market band → closing |
| Properties | Two-column asymmetric gallery, oversized imagery, filters as a quiet rail |
| Property detail | Full-bleed frame, sticky facts rail, spec table set as a printed schedule |
| Off-plan / projects | Chaptered scroll — one project per full screen, payment plan as a timeline |
| Market intelligence | Data-first: charts lead, prose follows, dark inversion throughout |
| Directory | Dense register with a stone search header; typographic, no cards |
| Areas / communities | Map-and-list split surface |
| Services | Numbered editorial list, each row opening into a full-width spread |
| About / Team | Portrait grid with generous white, staggered baselines |
| Contact | Single centred column, oversized form fields, nothing else on screen |
| Guides / Journal | Magazine spread with a wide measure and pull quotes |

## Also rebuilt

- **Masthead** — thin stone bar, ink wordmark, quiet mega-menu that opens as a
  full-width stone sheet with images, not a text dropdown
- **Footer** — inverted ink block, large wordmark, four columns, compliance line
- **Buttons, forms, chips, tables, charts** — all retuned to the new palette
- **Motion** — slower, heavier easing; images reveal by mask, figures count up,
  charts draw themselves; all of it off under reduced-motion
- **Hydration bug** on the market chart fixed in passing

## Technical notes

- Tokens rewritten in `src/styles.css` (`@theme inline`); the dark inversion
  becomes `data-surface="ink"` rather than the default canvas
- Syne + Plus Jakarta Sans stay self-hosted via `scripts/fetch-fonts.mjs`
- New layout primitives: `SplitMasthead`, `StoneSheet`, `ChapterScroll`,
  `FactsRail`, `RegisterTable`, `MapSplit` in `src/components/layouts`
- Imagery generated to `src/assets/photo/*`, wired through `src/lib/photos.ts`,
  externalised to the CDN so the repo stays light
- No data-layer, RLS, Supabase or SEO-schema changes; every route keeps its
  existing `head()` metadata and JSON-LD

## Order of work

1. Tokens, fonts, motion, and the shared shell (masthead + footer)
2. New photography generated and wired
3. Home page on the new composition
4. Properties, property detail, off-plan
5. Market intelligence, directory, areas
6. Services, about, team, contact, guides
7. Full sweep at desktop, tablet and phone; reduced-motion and RTL check
