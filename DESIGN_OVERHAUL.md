# DLX PROPERTIES — UI / UX OVERHAUL PLAYBOOK v2 (for Claude Code)

**Project:** DLX flagship website · **Ref:** ST-UAE-2026/163/DLX
**Mode:** REDESIGN — overhaul the visual + motion layer, preserve everything that already works.
**This version fixes the "it looks like a blog" problem with real assets, better type, and layout variety.**

---

## HOW TO USE THIS

1. Save as `DESIGN_OVERHAUL.md` in the repo root (replaces any earlier version). Read alongside `CLAUDE.md`.
2. Two skills are attached — **use them**: **taste-skill** (`design-taste-frontend`) as the design rulebook + its Pre-Flight Check; **playwright-cli** to screenshot every page at multiple scroll positions and self-critique visually before declaring a phase done.
3. Feed phases U0 → U5 one at a time. Each: todo list → step by step → PHASE SUMMARY.

---

## THE BRIEF, AND WHY THE CURRENT BUILD FAILS

The live build reads like a blog, not a luxury brokerage. Diagnosed causes (fix all four):

1. **Every section is the same template** (small grey uppercase eyebrow → big serif line → grey sentence → hairline rule, repeated). Monotony reads as a document. **The redesign must give every section a different composition.**
2. **Almost no photography.** We now have 21 high-quality Dubai photos. **Imagery must carry the page, alternating with editorial text.**
3. **Wrong typeface, set badly.** A heavy display serif shouting on every line. The reference tier (Emaar) uses a refined Garamond-class serif with restraint + a clean sans workhorse. **Replace the type system.**
4. **Unstructured white space.** Huge empty voids instead of intentional framing. **Whitespace must frame content, not replace it.**

**Taste dials:** `DESIGN_VARIANCE: 8` · `MOTION_INTENSITY: 7` · `VISUAL_DENSITY: 4` (raise density slightly — less empty void).

---

## REAL ASSETS (wire these in — no more text logos, no gradient placeholders)

**Logo kit** (`DLX-Properties-Logo-Kit/`): use the REAL logo, not a text "DLX".

- Header (on light): `01-Primary-Logo/black-on-white/` primary lockup, or the monogram from `02-Monogram-Icon/transparent/DLX-monogram-black-transparent-1024.png`.
- Header (on dark/over photos) + footer: `01-Primary-Logo/transparent/DLX-primary-white-transparent.png`.
- Favicon / app icons: `02-Monogram-Icon/favicon-app-icon/` (16–512).
- Give the logo generous clear space (min = height of the monogram). Never restyle or re-typeset it.

**Photography** (21 real Dubai images, e.g. Burj at night, Marina at dusk, skyline across water, aerial interchange, Palm, golden-hour towers): self-host optimized (AVIF/WebP + fallback), multiple sizes, `priority`/preload the hero, fixed aspect ratios to protect CLS. Assign the most cinematic (Burj night, Marina dusk, skyline) to hero and dark anchors; use calmer daylight shots for lighter editorial sections. Every showcase section gets a real image.

**Data** (source from public internet, then store in the existing tables — do not invent): real Dubai developer names (Emaar, DAMAC, Nakheel, Sobha, Meraas, Dubai Properties, Ellington, Binghatti, Azizi, Danube, etc.), real communities (Downtown, Business Bay, Dubai Marina, Palm Jumeirah, Dubai Hills Estate, JVC, Dubai Creek Harbour, Arabian Ranches, DAMAC Hills, MBR City, etc.), and representative projects per developer. Populate developers/projects/areas so the site is not empty. Mark any figures not yet from DLD as `sample` per the existing provenance system.

---

## LOCKED TYPOGRAPHY (this is the biggest single fix)

Match the Emaar-class reference: a refined serif used with restraint, on a clean sans workhorse that echoes the logo's wide-tracked "DLX PROPERTIES" wordmark.

- **Editorial serif (accents only, NOT every heading):** a Garamond-class or high-contrast transitional serif. Preferred self-hosted options: **EB Garamond**, **Cormorant** (used sparingly, larger sizes only), or license **Adobe Garamond Pro / Canela / Freight Display**. Use for the occasional hero line and pull-quotes, never for labels or every section title.
- **Primary workhorse sans (most of the UI, body, labels, many headings):** a calm neo-grotesk / humanist sans — **Neue Haas Grotesk** (licensed, ideal) or free equivalents **General Sans**, **Satoshi**, or **Söhne**-like. **Not Inter, not Jost, not a generic Google serif.**
- **Labels/eyebrows:** the sans in wide letter-spacing (echo the logo wordmark), small, quiet — and RATIONED (see bans).
- Self-host all fonts, `font-display: swap`. No Google Fonts `<link>` in production.
- Fix the current problem explicitly: stop setting a heavy serif at huge sizes on every heading. Most headings become the refined sans; serif is a special guest.

---

## LOCKED PALETTE (unchanged — Emaar-light canvas + Sobha green/gold anchors)

```
--paper:#FFFFFF  --paper-cool:#F6F8F7 (cool off-white, never warm cream)
--ink:#0C1411 (green-black)  --ink-panel:#132019
--green-deep:#1F3D34  --green:#2E5A4B
--gold:#C2A45C  (WHISPER only: hairlines/small marks/text-on-dark; never a fill)
--text:#141414  --muted:#8A8A8A  --on-dark:#ECEFEC  --on-dark-muted:#9FB2A8
```

Luxury comes from green + photography; gold whispers. Sharp corners (radius 0) throughout.

---

## LAYOUT VARIETY (kills the blog feel — MANDATORY)

No two consecutive sections may share a composition. Build a library of distinct section layouts and rotate them:

- Full-bleed image with overlaid type (cinematic).
- Asymmetric split (image one side, editorial the other, alternating sides).
- Editorial index / list (services), image thumbnails per row, not equal cards.
- Dark data anchor (green-black) with the pinned market moment.
- Horizontal gallery / scroll (residences).
- Image grid with varied cell sizes (communities), not a uniform 3-col grid.
- Type-only manifesto moment (rare, once).
  Rule of thumb: cinematic image moment → tight editorial text → data → image → index. Alternate light and dark deliberately. Content-rich, not padding-rich.

---

## MOTION (Sobha-quality feel, disciplined)

Add `lenis`, `gsap`+`ScrollTrigger`, `split-type`; keep `motion/react`.

- **Lenis smooth scroll** globally (off under reduced-motion).
- **Staggered line reveals** on section enter (SplitType).
- **Image parallax/depth** (`data-speed` ~1.15 vs ~0.75).
- **Mask reveals** on key photos (scale out of clip-path).
- **Pinned sequence (the effect the client asked for) — on 1, at most 2 sections:** section pins; scrolling advances its content in stages (part 1 → part 2 with a "view more"/"explore" reveal → part 3) → releases to a completely different next section. Home for it: the **Market Intelligence** section.
- Motion must be motivated. Everything degrades to static on mobile + reduced-motion. Animate only transform/opacity; no scroll listeners.

---

## HARD BANS (these are the AI/blog tells — remove on sight)

- No custom cursor. No "Scroll" cue.
- **Zero em-dashes (—) / en-dash separators (–)** anywhere visible. Use hyphens, commas, colons, or two sentences.
- **No eyebrow above every section.** Max one per three sections. (The current LICENSED / BASED / EVIDENCE / PORTFOLIO pattern is exactly the blog tell — cut most of them.)
- No `01/02/03` numbering unless a real sequence.
- No decorative dots. Middle-dot (·) rationed to one per metadata line.
- No warm cream/brass palette. No div-fake screenshots or gradient-as-photography (we have real photos now).
- No uniform equal-card grids repeated down the page.

---

## WHAT MUST NOT CHANGE (visual overhaul only)

Preserve: routes + page registry; Supabase schema/RLS/Edge Functions; DLD data logic + provenance; lead pipeline (form field names, qualification, scoring, sources, Resend dual emails); AI advisor (Noor) logic + guardrails; SEO/meta system, schema, sitemap, robots, OG; analytics/consent/Pixel/CAPI/GA4; admin logic + ROAS data. Re-skin and re-compose the front end; keep the plumbing and all external contracts intact.

---

## WORKING METHOD (every phase)

1. Read `CLAUDE.md`, this file, and the taste `SKILL.md`. State the design read + dials.
2. Todo list → step by step, preserving the "must not change" list.
3. **Verify with playwright-cli:** screenshot each changed page top/mid/lower on desktop + mobile, view them, self-critique vs the rubric, fix anything that reads generated or blog-like.
4. Run the taste **Pre-Flight Check**; every box passes.
5. **PHASE SUMMARY:** Built · Files · Env vars · How to test · Assumptions · Deferred.

---

# PHASES

## PHASE U0 — Assets, Type System, Motion Foundation

1. Redesign audit; list the blog-tells to retire (repeating template, over-used eyebrows, heavy serif, empty voids).
2. Import the real logo kit + wire favicons/app icons. Optimize + import the 21 photos (responsive, self-hosted).
3. Replace the type system: self-host the refined serif + the neo-grotesk sans; set the scale so sans is the workhorse and serif is a rare accent. Remove Jost + the heavy display-serif-on-everything.
4. Replace tokens with the locked palette; remove warm/brass tokens.
5. Build motion primitives (`Reveal`, `Parallax`, `MaskReveal`, `PinnedSequence`) + global Lenis with reduced-motion/mobile fallbacks.
6. Remove custom cursor + scroll cue; add a repo-wide em-dash check and fix all occurrences.
7. Build a **section-layout component library** (the 7 distinct families above) so later phases compose, not repeat.
8. Verify with playwright-cli. PHASE SUMMARY.

**Acceptance:** real logo + photos + new type live, palette + motion primitives ready, layout library exists, cursor/scroll-cue/em-dashes gone.

## PHASE U1 — Global Shell

1. Rebuild nav: real logo lockup, minimal single line, transparent over dark hero → solid on scroll, refined mobile menu (fix the current oversized serif list). Preserve destinations.
2. Rebuild footer as a green-black anchor: white logo lockup, large refined closing line, contact and legal links. Keep regulatory identifiers in applicable compliance blocks.
3. Tasteful page transitions (reduced-motion safe).
4. Verify light/dark/mobile. PHASE SUMMARY.

## PHASE U2 — Homepage (flagship, photography-led, every section different)

Compose from the layout library; no two consecutive sections alike; real photos throughout; one eyebrow per three sections.

1. **Hero** — full-bleed real photograph (Burj night or Marina dusk), refined headline (serif accent acceptable here, ≤2 lines), one line, one action, slow parallax + one line-reveal. No eyebrow, no scroll cue.
2. **Thesis** — short editorial statement over a calm daylight image split. Sans-led.
3. **Investment Snapshot** — the signature interactive, refined; wired to the real lead/qualification pipeline; DLD-cited result card.
4. **Market, read from the record** — green-black dark anchor; the **pinned sequence** lives here (headline read → chart builds → "explore" → release). Progressive disclosure, DLD-cited, freshness stamp.
5. **Services** — editorial index with a real image thumbnail per row, asymmetric; not equal cards, not numbered.
6. **Selected residences** — cinematic horizontal gallery, real project imagery + real names, mask reveal + parallax.
7. **Communities** — varied-cell image grid over real area photos, verdict cards; not a uniform 3-col grid.
8. **Noor** — green-black cinematic advisor moment showing guarded behaviour (cites DLD, hands off to human); wired to the real advisor.
9. **Proof** — named team (real faces when provided), developer partner marks, one short testimonial with attribution.
10. **Closing invitation + footer anchor.**
    Verify all breakpoints; run pre-flight. PHASE SUMMARY.

## PHASE U3 — Inner Pages (reuse the layout library; keep data/logic)

Community/area profile · Market Intelligence · Service pages · Listing index + detail · Guides/playbook + blog · Tools/calculators. Each imagery-led and varied, none reusing the section above it. Fix the "Properties" page from the screenshots (add hero image, real listings/data, remove empty voids). Verify each. PHASE SUMMARY.

## PHASE U4 — Admin, Forms & Lead UI

Re-skin the qualified multi-step form (preserve field names/steps/scoring/events); light legibility polish on admin + ROAS (no logic change); check all states pass contrast. Verify. PHASE SUMMARY.

## PHASE U5 — Motion Polish, Mobile, Performance, Pre-Flight

Final motion pass (two-pin budget, timings, parallax); mobile (pins release, grids collapse, touch targets); reduced-motion audit; Core Web Vitals (LCP<2.5s hero preload, CLS<0.1, INP<200ms); full taste Pre-Flight across the site; final playwright-cli sweep desktop+mobile. Final PHASE SUMMARY with before/after.

---

## REMINDERS

- The fix for "looks like a blog" = layout variety + real photography + right type + framed whitespace. Enforce all four.
- Preserve the plumbing; overhaul the surface.
- Real logo, real photos, real Dubai developer/community/project data.
- Serif is a rare guest; sans is the workhorse; gold whispers; green + photography carry the luxury.
- Verify visually with playwright-cli and pass the taste pre-flight before any phase is "done."
