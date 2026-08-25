# Redesign audit (Phase U0)

Recorded before any pixel moved, so the overhaul can be checked against where it
started. Mode, per taste skill Section 11.A: **Redesign - Overhaul**. New visual
language on top of existing content, information architecture and plumbing.

## Design read

A redesign of a premium Dubai property-advisory site for international HNW
buyers, with an ultra-luxury editorial language (Emaar-light canvas, Sobha-deep
green and gold cinematic anchors), leaning toward photography-led layouts, an
editorial serif, and disciplined GSAP/Lenis scroll motion.

Dials: `DESIGN_VARIANCE: 8` · `MOTION_INTENSITY: 7` · `VISUAL_DENSITY: 3`.

Dial reading of the site as it stood: variance 4, motion 3, density 3. The
composition was symmetrical and column-based, the motion was one fade-and-rise
reveal reused everywhere, and the whitespace was already generous. The gap the
overhaul closes is variance and motion, not density.

## Brand tokens, before

| Role | Value |
| --- | --- |
| Ink | `#000000` (pure black) |
| Paper | `#FFFFFF` |
| Slate | `#8A8A8A`, darkened to `#666666` for small text |
| Accent | Sand/gold `#B08D4C`, darkened to `#7E622F` for small text |
| Accent soft | `#EDE6DB` (warm beige, used as a section background) |
| Display font | Cormorant Garamond, weight 300, from Google Fonts |
| Body font | Jost, weight 300, from Google Fonts |
| Radius | 0 everywhere, except `--radius-xl: 2px` |

## Information architecture (preserved verbatim)

Registry: `src/config/pages.ts`. Thirteen registered pages, eight of them in the
primary nav.

`/` · `/properties` · `/services` · `/market-intelligence` · `/areas` ·
`/tools` · `/developers` · `/team` · `/guides` · `/blog` · `/about` ·
`/privacy` · `/contact`

Dynamic routes: `/areas/$slug`, `/blog/$slug`, `/developers/$slug`,
`/guides/$slug`, `/lp/$slug`, `/projects/$slug`, `/properties/$slug`,
`/reports/$token`, `/services/$slug`, `/tools/$slug`, plus `/$lang/*` for the
five localised shells and `/admin/*`.

Nav labels, slugs, anchor ids and form field names do not change.

## AI tells present, and what happens to them

| Tell | Where | Action |
| --- | --- | --- |
| Custom cursor | `src/components/site/cursor.tsx`, mounted in `__root.tsx`, plus `html[data-cursor-custom]` rules in `styles.css` | Deleted |
| Em-dash | 778 occurrences across `src/`, including page titles and meta descriptions | All rewritten, plus a check script |
| En-dash separator | 26 occurrences | All rewritten |
| Warm beige surface | `--sand-soft: #EDE6DB` used as the closing section's background | Replaced by the cool `--paper-cool` |
| Brass accent | `#B08D4C` as the single accent | Replaced by green as the signature, gold demoted to a hairline whisper |
| `01 / 02 / 03` numbering | Home page "index of disciplines" list | Numbers dropped |
| Eyebrow on every section | Home page ran five in nine sections; site-wide there are over ninety `<Eyebrow>` uses | Budgeted to one per three sections per page |
| `window.addEventListener("scroll")` | `src/components/site/header.tsx` | Replaced by an IntersectionObserver sentinel |
| Pure black `#000000` | `--ink` | Replaced by `#0C1411`, a deep green-black |
| Google Fonts `<link>` | `src/lib/fonts.ts`, emitted from `__root.tsx` | Self-hosted woff2 |
| Middle dot as a general separator | 33 occurrences | Rationed to one per metadata line |

No scroll cue was present, so there was nothing to remove.

## Patterns worth keeping

- The editorial voice of the copy. Restrained, specific, no filler verbs.
- Progressive disclosure on data (headline read, then chart, then gated report).
- The freshness stamp and the Dubai Land Department attribution on every figure.
- `Reveal` shipping content visible and hiding it only on the client, so the
  server-rendered HTML never contains hidden text.
- Radius 0 throughout. Already one shape system.
- Single-line desktop nav at 80px. Already within the cap.

## What must not change

Route structure and `src/config/pages.ts`; the Supabase schema, RLS and Edge
Functions; the lead pipeline and its field names, scoring and dual-email flow;
the advisor's guardrails and retrieval; `pageHead()`, `src/lib/schema.ts`, the
sitemap, robots and OG generation; analytics events and consent gating; admin
logic and the ROAS data.

## Local verification note

Supabase is not reachable from the build sandbox, so route loaders fall back to
empty and data-backed sections render as nothing. Visual checks run against a
local PostgREST stand-in that serves fixture rows; it lives outside the repo and
no source file knows about it.
