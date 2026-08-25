# DLX PROPERTIES — UI / UX OVERHAUL PLAYBOOK (for Claude Code)
**Project:** DLX flagship website · **Ref:** ST-UAE-2026/163/DLX
**Mode:** REDESIGN — overhaul the visual and motion layer, preserve everything that already works.

---

## HOW TO USE THIS

1. Save this file in the repo root as `DESIGN_OVERHAUL.md`. Claude Code reads it alongside the existing `CLAUDE.md`.
2. Two skills are attached to this project. **Use them, do not ignore them:**
   - **taste-skill** (`design-taste-frontend`) — read its `SKILL.md` fully before writing any UI. It is the design rulebook. Set the dials, follow the hard rules, and run its **Pre-Flight Check (Section 14)** before declaring any phase done.
   - **playwright-cli** — after building each page, screenshot it at several scroll positions, look at the screenshots, and self-critique against the taste rubric. Do not declare a page done from code alone; verify it visually.
3. Feed the phases below **one at a time** (U0 → U5). Each phase: build a todo list, work step by step, then output a **PHASE SUMMARY**.

---

## THE DESIGN READ (state this back before building)

> Reading this as: a redesign of a premium Dubai property-advisory site for international HNW buyers, with an ultra-luxury editorial language (Emaar-light canvas, Sobha-deep green/gold cinematic anchors), leaning toward photography-led layouts, an editorial serif, and disciplined GSAP/Lenis scroll motion.

**Taste dials for this brief:** `DESIGN_VARIANCE: 8` · `MOTION_INTENSITY: 7` · `VISUAL_DENSITY: 3`.

---

## WHAT MUST NOT CHANGE (preserve — this is a visual overhaul, not a rebuild)

Do not touch, rename, or break any of the following. The backend and logic are working; only the presentation layer changes.

- Route structure, page slugs, and the page registry (`src/config/pages.ts`).
- The Supabase schema, RLS, Edge Functions, and all data logic (DLD engine, provenance stamps, `area_stats`).
- The lead pipeline: form field names, qualification/scoring logic, lead sources, dual-email flow (Resend).
- The AI advisor (Noor) logic, guardrails, and knowledge retrieval.
- The SEO/meta system (`pageHead()`, `src/lib/seo.ts`), schema (`src/lib/schema.ts`), sitemap, robots, OG generation.
- Analytics/tracking events, consent gating, Pixel/CAPI/GA4 wiring.
- Admin logic and the ROAS dashboard data.

You are re-skinning and re-composing the front end and adding motion. Keep the data and the plumbing intact. If a visual change requires touching a shared type or a form component, preserve its external contract (props, field names, event names).

---

## LOCKED DESIGN SYSTEM (do not freelance these)

### Palette — Emaar-light canvas + Sobha-deep green/gold anchors
Define as CSS variables / Tailwind tokens. One accent, used consistently. No warm cream, no brass fills.

```
Canvas (light-primary):
  --paper:        #FFFFFF
  --paper-cool:   #F6F8F7   /* faint green-grey off-white, NEVER warm cream */
Dark anchors (cinematic sections: hero, market, advisor, footer, key CTAs):
  --ink:          #0C1411   /* deep green-black */
  --ink-panel:    #132019   /* lifted dark panel */
Green (the signature):
  --green-deep:   #1F3D34
  --green:        #2E5A4B
Gold (WHISPER only — hairlines, small marks, text-on-dark; never a fill, never on light-cream):
  --gold:         #C2A45C
Text:
  --text:         #141414   /* cool near-black, not warm espresso */
  --muted:        #8A8A8A   /* brand slate grey */
  --on-dark:      #ECEFEC
  --on-dark-muted:#9FB2A8
```

Discipline: the luxury weight comes from **green + photography**, not from gold. Gold is a 1px whisper. Light sections are cool-white, never beige. Lock one accent and audit every component for it.

### Typography
- **Display serif** (justified: the DLX logo is a serif monogram). Preferred: license one premium face (Canela, Domaine Display, or Saol Display) and self-host. Acceptable free fallback: Cormorant Garamond or Playfair Display. Emphasis = italic/weight of the SAME family, never a second font.
- **Body / UI grotesk:** replace Jost with **General Sans** or **Satoshi** (Fontshare, free to self-host) or Geist. **Not Inter.**
- Self-host fonts with `font-display: swap`. No `<link>` to Google Fonts in production.
- Italic descender clearance: any italic display word with `y g j p q` gets `leading-[1.1]` min + bottom reserve.

### Shape & spacing
- One corner-radius system: **sharp (radius 0)** everywhere, matching the editorial brand. Do not mix rounded and sharp.
- Generous whitespace (density 3): large section padding, air around type.

---

## MOTION SYSTEM (the Sobha-quality feel, done with discipline)

Add these libraries (check `package.json` first, then install): `lenis`, `gsap` (with `ScrollTrigger`), `split-type`. Keep `motion/react` for component-level reveals.

**Global feel**
- **Lenis smooth scroll** site-wide — eased, slightly weighted inertia. This is the invisible backbone of the premium feel. Disable under `prefers-reduced-motion`.

**Reusable motion patterns (build as components, reuse):**
1. **Staggered line reveal** — on section enter, headline and text rise + fade line by line (SplitType + Motion `whileInView` or GSAP). Paced to lead the eye.
2. **Image parallax / depth** — foreground content and background photography move at different speeds (`data-speed` ~1.15 vs ~0.75) for cinematic depth. GSAP or ScrollSmoother-style.
3. **Mask reveal** — key photographs uncover themselves (scale out of a clip-path mask) rather than plain-fading.
4. **Pinned sequence (THE pattern you asked for — use on 1, at most 2 sections, never more):** the section **pins** to the viewport; as the user keeps scrolling, its content advances in stages (part 1 → part 2 with a "View more"/"Explore" reveal → part 3), then releases to a completely different next section. Implement with the taste skill's canonical GSAP ScrollTrigger `pin: true`, `start: "top top"`, scrubbed skeleton. The **Market Intelligence** section is the home for this: pin it, reveal the headline read, then the chart builds, then the "Explore the full market" step, then release.

**Discipline (mandatory):**
- Motion must be motivated (hierarchy, storytelling, feedback, or state). No motion "because it looks cool," no infinite loops, no marquee spam (max one if any).
- The pinned-sequence pattern appears on **at most two** sections total. Overuse makes it gimmicky and wrecks mobile/perf.
- Everything degrades to clean static under `prefers-reduced-motion` and simplifies on mobile (`< 768px`): pins release, parallax flattens, reveals become instant.
- Animate only `transform`/`opacity`. No `window.addEventListener('scroll')` — use Lenis/ScrollTrigger/IntersectionObserver.

---

## HARD BANS (remove on sight — these are why the current UI reads as AI-made)

- **No custom cursor.** Remove any custom-cursor component entirely.
- **Zero em-dashes (`—`) and en-dash separators (`–`) anywhere visible** — headlines, body, labels, buttons, alt text, emails. Use hyphens, commas, colons, or two sentences. This is non-negotiable (taste skill Section 9.G).
- **No "Scroll" / "Scroll to explore" cue.** Remove it.
- **No eyebrow above every section.** Maximum one eyebrow per three sections across the page (hero counts as one).
- **No `01 / 02 / 03` numbering** unless it is a genuine ordered sequence. The services list is not a sequence — drop the numbers.
- **No decorative dots** (coloured dots before labels/nav/stats) unless conveying real state.
- **No warm cream + brass + espresso palette.** We are on green/gold/monochrome; audit for any stray warm-beige background or brass fill.
- **No div-based fake screenshots**, no hand-rolled decorative SVG illustrations, no pure-text "minimalism" standing in for imagery.
- **Middle-dot (`·`) rationed** to at most one per metadata line.

---

## PHOTOGRAPHY

This is the single biggest lever. The site is photography-led.
- Real cinematic Dubai imagery (architecture, interiors, golden-hour skyline, aspirational lifestyle) fills the hero and every showcase section. The client will supply real listing / developer / licensed photography.
- Until real assets arrive, use clearly-labelled slots plus temporary placeholders via `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` (seed describes the shot, e.g. `dlx-businessbay-tower-dusk`). Never fill with gradients-as-photography or fake UI.
- Structure image components so real assets drop into the same frames (aspect ratios fixed, `priority`/preload on the hero, reserved space to protect CLS).

---

## WORKING METHOD (every phase)

1. Read `CLAUDE.md`, this `DESIGN_OVERHAUL.md`, and the taste `SKILL.md`. State the design read and dial values.
2. Build a **todo list** for the phase.
3. Work step by step, marking each done. Preserve everything under "What must not change."
4. **Verify visually with playwright-cli:** screenshot each changed page at top / mid / lower scroll on desktop and mobile widths, view the screenshots, and self-critique against the taste rubric. Fix what looks generated.
5. Run the taste **Pre-Flight Check** (Section 14). Every box must pass.
6. Output the **PHASE SUMMARY**: Built · Files · Env vars · How to test · Assumptions/decisions · Deferred.
7. Stay in the current phase.

---

# THE PHASES

## PHASE U0 — Audit, Design System & Motion Foundation
1. Redesign audit: capture current brand tokens, IA, routes, and list the AI-tells present (cursor, em-dashes, eyebrows, palette, etc.) to retire. Confirm what must be preserved.
2. Install/confirm `lenis`, `gsap` + `ScrollTrigger`, `split-type`. Keep `motion/react`.
3. Replace the token layer with the locked palette + typography (self-host serif + grotesk). Remove old warm/gold-brass tokens and the Jost body font.
4. Build the motion primitives as reusable components: `<Reveal>` (staggered line/element), `<Parallax>`, `<MaskReveal>`, `<PinnedSequence>`, plus global Lenis provider with reduced-motion + mobile fallbacks.
5. Remove the custom cursor and the scroll cue globally.
6. Add a repo-wide check/script to catch em-dashes in source and content; fix all existing ones.
7. Verify with playwright-cli (tokens/fonts render, Lenis scrolls, reduced-motion disables). PHASE SUMMARY.

**Acceptance:** new token system + fonts live, motion primitives + Lenis working with reduced-motion/mobile fallbacks, cursor and scroll cue gone, zero em-dashes in source.

## PHASE U1 — Global Shell (nav, footer, transitions)
1. Rebuild the **nav**: minimal, single line, ≤ 80px, elegant; transparent over dark hero, solid on scroll; mobile hamburger. Preserve the same nav destinations/labels (SEO + muscle memory).
2. Rebuild the **footer** as a deep green-black anchor with a large serif closing line, real contact, RERA ORN 40905, and the legal links (privacy/terms).
3. Add tasteful **page transitions** (motion), reduced-motion safe.
4. Verify both light and dark contexts, mobile, reduced-motion (playwright-cli). PHASE SUMMARY.

**Acceptance:** premium nav + footer in the new system, single-line desktop nav, page transitions, all preserved destinations intact.

## PHASE U2 — Homepage Overhaul (the flagship)
Rebuild the homepage to this photography-led, 10-section structure. At least four distinct layout families, one eyebrow per three sections, real imagery throughout.
1. **Hero** — full-bleed real photograph, one serif headline (≤ 2 lines), one line of sub (≤ 20 words), one primary action. Slow image parallax + one-time line reveal. No eyebrow, no scroll cue.
2. **The thesis** — type-only editorial statement of the private-advisory positioning, on cool-white. Staggered reveal.
3. **Investment Snapshot** — refine the signature interactive (concierge split): three quiet questions return a tailored, DLD-cited card with a plain-language read. Keep it wired to the real lead/qualification pipeline.
4. **Market, read from the record** — deep-green dark anchor; implement the **pinned sequence** here: pin, reveal the headline read, build one elegant chart, then the "Explore the full market" step, then release. Progressive disclosure, DLD-cited, freshness stamp.
5. **Services** — editorial index with real imagery, asymmetric. Not equal cards, not numbered.
6. **Selected residences** — cinematic large-photography showcase (mask reveal + parallax), horizontal or asymmetric.
7. **Communities** — verdict cards over real area photography, with genuine visual variation.
8. **Noor, the advisor** — deep-green dark cinematic product moment showing the guarded behaviour (cites DLD, hands off to a human). Wired to the real advisor.
9. **Proof** — named team with real faces, developer partner logos (real marks), one short testimonial (≤ 3 lines) with proper attribution.
10. **Closing invitation + footer anchor.**
Verify at all breakpoints with playwright-cli; run the pre-flight. PHASE SUMMARY.

**Acceptance:** a photography-led homepage with the pinned market moment, refined Snapshot, real advisor, four-plus layout families, passing the taste pre-flight, working on mobile and reduced-motion.

## PHASE U3 — Inner Pages
Re-skin in the same language, reusing the motion primitives. Keep all data/logic.
1. **Community / area profile** — cinematic area hero, verdict card, real DLD stats with plain-language reads, a five-year trend chart, gated report CTA, freshness stamp.
2. **Market Intelligence** page — the fuller data showcase; may reuse a pinned moment (still within the two-pin budget across a page).
3. **Service pages** — editorial, imagery-led, each with its qualified enquiry.
4. **Listing index + detail** — cinematic full-bleed detail, gallery (mask reveal), floor plan, map, enquiry panel.
5. **Guides / playbook + blog** — editorial long-form with strong type, sticky contents, FAQ/schema preserved.
6. **Tools hub + calculators** — clean, calm, on-brand; keep all calculation + lead logic.
Verify each with playwright-cli. PHASE SUMMARY.

**Acceptance:** every public inner page in the new system, data/SEO/lead logic intact.

## PHASE U4 — Admin, Forms & Lead UI Polish
1. Re-skin the qualified multi-step form in the new system (preserve field names, steps, scoring, events).
2. Light, functional polish of the admin (leads inbox, content, ROAS) for legibility and brand consistency. Do not change admin logic or data.
3. Ensure form/consent/error/empty/loading states all pass contrast and read well.
Verify. PHASE SUMMARY.

**Acceptance:** forms and admin visually consistent, all logic and field contracts preserved.

## PHASE U5 — Motion Polish, Mobile, Performance & Pre-Flight
1. Final motion pass: timing, easing, the pinned sequence(s), parallax depth, reveals. Confirm the two-pin budget and that everything is motivated.
2. Mobile: confirm pins release, parallax flattens, layouts collapse cleanly; touch targets and legibility.
3. Reduced-motion: full audit, everything degrades to static.
4. Performance: Core Web Vitals (LCP < 2.5s with hero preload, CLS < 0.1, INP < 200ms); lazy-load below-the-fold; keep GSAP/Lenis isolated and cleaned up.
5. Full taste **Pre-Flight Check** across the whole site; fix every failing box. Final playwright-cli sweep on desktop + mobile.
6. Final PHASE SUMMARY with before/after notes and any deferred items.

**Acceptance:** cohesive, performant, accessible, unmistakably-DLX site that passes the taste pre-flight and feels human-crafted, not generated.

---

## REMINDERS
- Preserve the plumbing; overhaul the surface.
- Photography leads; type and green carry the luxury; gold whispers.
- Motion is motivated and disciplined; the pinned sequence is special because it is rare.
- Zero em-dashes, no cursor, no scroll cue, no AI-tell palette.
- Verify visually with playwright-cli and pass the taste pre-flight before any phase is "done."
