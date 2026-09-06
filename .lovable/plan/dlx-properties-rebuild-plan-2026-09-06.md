# DLX Properties — rebuild plan

Two jobs, everything else serves them:

1. **The DLD directory and market data** — the thing nobody else has, built so Google and AI assistants read it, cite it and send people to us.
2. **A lead magnet** — every page ends in a reason to leave a name, answered by a real team, an AI chat advisor and an AI phone advisor.

We never say we are small or short of stock. Where we have no photo, we show the record, the data and a "register your interest — our team will come back with the best matching projects" action.

## What I now have from you

Company: D L X Properties L.L.C., trade licence 1307563, RERA ORN 40905, office S210, Property Investment Office 4 S1, Dubai Investment Park First, Dubai. Phone and WhatsApp +971 54 599 6911, info@dlxproperties.com, hours 9–5, Friday 2–8, Sunday closed. Seven consultants with BRN numbers, experience, specialities, languages and bios: Shahul Hameed (CEO), Sourez Afrid (Sales Director), Fayuros Munavvar, Mohammed Nihal, Mohammed Hafeez, Abdul Zakeer, Mohammed Rameez. Headshots to follow — portraits get a designed placeholder until then.

Projects in hand: Azizi Florence (masterplan sheet, brochure, finishes deck) and Sobha City (master brochure, factbook, The Orchard, The Terraces, River Cove). More Dubai projects to come from you.

---

## Phase 1 — Real company identity
Replace every placeholder: address, phone, WhatsApp, email, hours, licence, legal name, map location, contact schema. Business Bay placeholders removed. Contact page rebuilt around the real office.

## Phase 2 — New visual identity
The site currently reads like a long essay. Rebuild the look:

- **Palette** — deep near-black ink, clean white, and one confident colour. My recommendation: a deep marine blue (authority, finance, trust — reads well to US, European and GCC investors) with a restrained brass highlight for figures and accents. Dark green is the alternative if you prefer it; pick one in the plan review.
- **Type** — a tighter, more commercial pairing: a strong geometric/grotesk for headlines with real weight, and a highly legible sans for body and numbers. No more editorial-serif essay feel.
- **Layout** — cards, panels, dense data blocks, strong section rhythm, big numbers, imagery-forward. Less prose column, more product.
- Applied globally through tokens so every page changes at once.

## Phase 3 — Team page
Real page for the seven consultants: portrait placeholder, name, role, BRN, years, specialities, languages, bio, LinkedIn, direct WhatsApp and call. Each has a profile page and can be attached to enquiries. Drop-in slots for headshots when you send them.

## Phase 4 — Directory and market data, done properly
The DLD directory (209,200 records) and market aggregates are live but under-exposed. This phase makes them the centrepiece:

- Fast, filterable directory landing with real entry points: developers, projects, communities, brokers, offices.
- Every developer and project record gets a full page: identity, licence, status, unit counts, escrow agent, community, and its recorded market activity — even where we hold no photo.
- Cross-links: developer → its projects → its community → that community's market data → related projects.
- Named, dated source attribution and a clear non-affiliation line on every record.

## Phase 5 — Interactive data
Replace static charts with genuinely interactive ones: hover readouts, switch metric, switch monthly/quarterly/yearly, compare communities, animated draw-in, share and download. Plain-language headline first, chart second, full detail third. A gated full report captures the lead.

## Phase 6 — Abu Dhabi vs Dubai analysis
Using our own data: why Abu Dhabi is gaining credibility, what freehold changes mean, how registered activity compares. Published as a flagship evidence piece — this is the kind of page AI assistants quote.

## Phase 7 — The two projects
Full project pages for Azizi Florence and Sobha City: renders and plans extracted from the brochures, unit mixes, sizes, amenities, payment terms, handover, brochure downloads, assigned consultant, enquiry form. Featured on the homepage and in off-plan. The three fictional concept projects are deleted. Publication of each page is held behind its advertising permit fields so nothing goes live uncompliant.

## Phase 8 — Lead engine
Every surface captures: project enquiry, register interest, valuation, guide download, calculator, report unlock, chat, call. One lead record with scoring, routing to a consultant, admin alert and client confirmation email, WhatsApp handoff, and full source and campaign attribution. Admin view to work the pipeline.

## Phase 9 — AI chat advisor
Lovable AI, grounded in our own DLD directory, market aggregates, guides and projects. It answers Dubai/UAE property, investment, Golden Visa and relocation questions, cites the data with its date, never invents prices or legal advice, qualifies the visitor and creates a lead with the full transcript.

## Phase 10 — AI voice advisor
Fish Audio voice with the same brain and the same guardrails. Call and callback entry points, consent, transcript and summary into the same lead record, admin notification. Needs your Fish Audio API key.

## Phase 11 — SEO and AEO
Unique titles, descriptions and social cards everywhere; full structured data (organisation, agent, team members, projects, offers, breadcrumbs, FAQ, articles, dataset); clean sitemaps including directory records; fast server-rendered HTML so crawlers and AI read everything without running scripts; an AI-readable knowledge feed and an agent-friendly index of what our data covers; internal linking so no page is an orphan.

## Phase 12 — Guides in question form
Rewrite and extend guides as the questions people actually ask AI and Google — "Can a foreigner buy property in Dubai?", "What are the total buying costs?", "How do I get the Golden Visa through property?", "Dubai or Abu Dhabi?", "What are service charges?" — each answered directly in the first lines, with our data, then a next step. Grouped clearly and linked from projects, communities and the advisor.

## Phase 13 — Analytics, tracking and readiness
GA4, Meta Pixel and server-side conversions, Google Ads tag, campaign attribution on every lead, and the checks needed before you spend on ads.

## Phase 14 — Verification and launch
Mobile and desktop pass on every page, real leads and emails proven end to end, accessibility, speed, no invented content, no compliance gaps. Then ship.

---

## Further suggestions worth adding
- A saved-search / property alert signup — recurring reason to return, and a second lead capture.
- An investor calculator suite tied to real DLD figures rather than generic maths.
- A per-community "market snapshot" PDF, generated on request, gated by email.
- Arabic, Russian, Hindi and Chinese versions of the highest-intent pages (the framework already exists).
- Live "recently registered activity" ticker on the homepage — proof of a working market, sourced from our data.
- A short weekly market note; AI assistants favour recently updated, dated sources.

## Decisions I need from you
1. **Colour** — deep marine blue, or dark green? (Black and white base either way.)
2. **Fish Audio API key**, when you have it.
3. **Advertising permit number, permit expiry and responsible broker BRN** for Azizi Florence and Sobha City.
4. **Headshots** for the seven consultants.
5. Which consultant should be the default owner of enquiries that arrive with no project attached?

## Technical notes
- New tables for real commercial projects, unit types, payment stages, media, documents and compliance, with public read only when published and compliance-passed; leads gain a project link. Media and brochures to Supabase Storage, not the repo.
- Design tokens rewritten in `src/styles.css` plus self-hosted font swap in `styles.fonts.css`; components consume tokens only.
- Team data seeded to `agents`; `src/config/brand.ts` corrected.
- Directory and market schema, migrations and RPCs stay untouched — this work is presentation, linking and new surfaces on top of them.
- AI chat and voice run as server functions against Lovable AI, with a retrieval layer over the directory, market aggregates, guides and projects; both write to `leads` and `advisor_conversations`.
- Fictional fixtures (`src/data/off-plan.ts`, demo gating, demo form) removed.
