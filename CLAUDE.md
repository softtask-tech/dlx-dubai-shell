# DLX PROPERTIES — PROJECT CONTEXT & RULES

You are building the flagship website for DLX Properties, a premium Dubai real estate brokerage (RERA ORN 40905, Business Bay). This is a landmark project: it must look and feel like it came from a top-tier studio. Read this file fully before every task.

## THE VISION (one line)
Make a small brokerage look like an institution: ultra-luxury editorial design + official Dubai Land Department (DLD) data + an AI advisor that makes it all simple — a combination competitors cannot copy.

## AUDIENCES (design for all five)
- USA / Western investors — want numbers, evidence, official data, 0% tax proof.
- European buyers — want transparency, trust, calm premium design.
- Arab / GCC — want stature, credibility, native Arabic, long-term partner feel.
- Indian / Pakistani — want ROI clarity, yields, area comparisons.
- Relocating families — want Golden Visa, schools, healthcare, cost of living, relocation help.
Everyone must find their reason to trust within the first scroll.

## GOLDEN UX RULE — PROGRESSIVE DISCLOSURE
Never put intimidating data on the surface. Every data moment has three layers:
1. A plain-language HEADLINE anyone gets in two seconds.
2. An "explore" reveal (chart / comparison) for the curious.
3. A gated full report for the serious (which also captures the lead).
Always pair a number with a plain-English "what this means for you" sentence.

## AESTHETIC — ULTRA-LUXURY EDITORIAL
- Reference: high-end fashion / architecture brand. NEVER a Bayut-style portal.
- Palette: monochrome base — Black #000000, White #FFFFFF, Slate Grey #8A8A8A — plus ONE warm accent: sand/gold #B08D4C and soft sand #EDE6DB. White theme. Accent used sparingly.
- Typography: elegant editorial serif for headings (large, refined, echoing the DLX "DX" serif monogram); clean sans-serif for body. Typography-led.
- Layout: big type, generous whitespace, asymmetric editorial grids, full-bleed cinematic imagery.
- Motion (rich but tasteful): reveal-on-scroll, gentle image parallax, count-up numbers, self-drawing charts, refined custom cursor, page transitions like turning a page in a monograph. Meaningful, never gratuitous.
- Feel: calm, confident, fast. Restraint signals confidence. No popups. Premium feels calm.

## TECH STACK & CONVENTIONS
- Frontend: React + Vite + TypeScript + Tailwind. Framer Motion for animation. Recharts (or D3) for editorial charts.
- Backend/DB/Auth/Storage: Supabase (Postgres + Auth + Storage + Edge Functions).
- Email: Resend (dual emails — admin notification + client confirmation).
- AI chat: Lovable AI (high rate limit).
- Voice: Fish Audio (voice) + a telephony/LLM layer for logic; transcript + summary posted to admin via webhook.
- Tracking: Meta Pixel + Conversions API (server-side), Google Ads tag, GA4.
- Data: Dubai Pulse open data (DLD) via OAuth → cleaned into our own Postgres.
- Maps: Google Maps or Mapbox. FX: a free currency API. Weather: Open-Meteo.
- SEO: server-render / pre-render pages so crawlers and AI read content without executing JS. Per-page meta.
- Code: TypeScript strict, small reusable components, design tokens (no hard-coded colors/fonts), accessible (a11y), mobile-first, fast (lazy-load images, code-split).
- Secrets: never hard-code keys. Use env vars (`.env`) and document each new one.

## AI ADVISOR GUARDRAILS (chat + voice share one brain)
- Scope: answer ONLY Dubai/UAE real estate, property investment, Golden Visa, and relocation topics. Politely decline anything else.
- Safety: NEVER invent prices, availability, or legal/visa/tax specifics. Cite DLD for data ("Source: Dubai Land Department" + freshness date). Route specifics to a human consultant.
- Knowledge source: our DLD market database + the playbook guides + listings + services.

## SEO / AEO / AI-CRAWLABILITY — NON-NEGOTIABLE, ON EVERY PAGE
- Unique per-page title, meta description, tagline, OG image and Twitter card for every page, listing, guide and blog. Never global defaults.
- Schema.org JSON-LD: Organisation, RealEstateAgent, Listing, Review, FAQ, Article.
- FAQ blocks and answer-shaped content in natural buyer language.
- NEVER use hidden keywords or invisible meta tricks — they are penalised by Google and ignored by AI. Win with real, visible, useful content + clean schema.

## DATA ENGINE COMPLIANCE
- Cite DLD as the data source (adds credibility). Comply with the open-data licence. Never imply DLD affiliation.
- Always show a freshness stamp: "Updated [month] · Source: Dubai Land Department".

## LEAD PIPELINE (everything captures into one place)
- Every form, tool, chat and call creates a lead in Supabase with: contact info, qualification answers (budget / timeline / intent), Hot/Warm/Cold score, UTM source, timestamp, and source type.
- On every new lead: send admin notification email + client confirmation email (Resend).

## WORKING METHOD (follow this for EVERY phase)
1. Read this `CLAUDE.md` and the phase prompt fully before coding.
2. Create a **todo list** covering every step in the phase.
3. Work through the steps **one at a time**, marking each done as you go. Test as you build.
4. Stay within the current phase — do NOT build features from later phases.
5. If a step needs a secret/API key I haven't provided, stub it cleanly behind an env var and note it — don't block.
6. When all steps are done, output a **PHASE SUMMARY** with these headings:
   - **Built** — what now works.
   - **Files** — key files added/changed.
   - **Env vars needed** — any new keys, with where to get them.
   - **How to test** — steps to verify.
   - **Assumptions / decisions** — anything you chose.
   - **Deferred** — anything intentionally left for a later phase.

---

## IMPLEMENTATION NOTES (repo-specific)

These reflect how the rules above are actually wired in this codebase.

- **Router**: TanStack Start (SSR) with file-based routing in `src/routes`. Pages are
  server-rendered, so crawlers and AI read full content without executing JS.
  `routeTree.gen.ts` is generated — never edit it by hand.
- **Brand facts** live in `src/config/site.ts` — one source of truth for name, RERA ORN,
  address, contacts, socials and the page registry. Never re-type a brand fact in a component.
- **SEO**: every route builds its head with `pageHead()` from `src/lib/seo.ts` and passes a
  unique title, description, OG image and JSON-LD. Adding a page means adding it to
  `SITE_PAGES` so it reaches the sitemap too.
- **Schema**: JSON-LD builders live in `src/lib/schema.ts`. Organisation / RealEstateAgent and
  WebSite schema are emitted once from `__root.tsx`; page-level schema (Breadcrumb, FAQ,
  Article, Listing) is emitted by the page that owns it.
- **Motion**: durations and easings come from `src/lib/motion.ts`. Every animation must degrade
  gracefully under `prefers-reduced-motion` — the custom cursor and smooth scroll switch
  themselves off, and reveals resolve to their final state instantly.
- **Design tokens**: colours, fonts, spacing and radii are CSS variables in `src/styles.css`.
  No hard-coded hex values or font stacks in components.
