# Featuring Azizi Florence and Sobha City

## What I found

**Your two projects**

- **Azizi Florence** — Azizi Developments. The information sheet gives plot 2930/Mulk 89, a 2,799,527 m² masterplan at Umm Fannain, **Sharjah**. Cluster 01 holds 1,304 homes: 198 villas (88 four-bed, 73 five-bed, 37 six-bed) and 1,106 townhouses (three- and four-bed, mid and end). Sellable areas run from about 2,228 sq ft for a three-bed mid townhouse to 4,949 sq ft for a six-bed villa. Villas are ground plus two floors at 11.5 m, townhouses ground plus one at 9.7 m, with pool provisions on villas. The amenity list is long and specific: a 1.7 million sq ft signature central park, six community parks, two mosques, 50 km of green walkways, 49 km of roads, a 3,000-capacity amphitheatre, 12 km jogging track, theme park, water play, food-truck park and much more. A second file covers villa and townhouse finishes.
- **Sobha City** — Sobha, in **Abu Dhabi**. Five documents: the master brochure, a factbook, and three sub-collections (The Orchard, The Terraces, River Cove Residences).

**Two things worth saying plainly.** Neither project is in Dubai. The whole site is written as a Dubai brokerage with Dubai Land Department evidence, so I need to widen the wording on the pages that touch these projects (and only those) to "UAE", and keep the market data clearly labelled as Dubai-only. Second, advertising a live project needs the permit details from the relevant regulator — Sharjah for Florence, Abu Dhabi for Sobha City — plus your office registration number and the responsible broker's number. I'll build the pages fully and hold public publication of each one behind those fields, so nothing goes live uncompliant. Send me the numbers and each page flips to public.

**Current state of the site.** The off-plan section currently shows three invented concept projects held behind a preview-only switch, with a form that deliberately sends nothing. Real project pages, real enquiries, real photos and the database behind them do not exist yet. Everything else — the DLD directory, market intelligence, leads, emails — is live and untouched by this work.

---

## Phase 1 — Read the source material properly

Extract every fact from the five Sobha brochures, the factbook, the Florence sheet and the finishes deck: unit mixes, sizes, bedroom counts, payment terms, handover dates, amenity lists, locations, specifications. Anything a brochure does not state stays blank rather than invented. Output is a written fact sheet per project for you to confirm before it becomes page content.

## Phase 2 — Photos

Pull the renders, site plans and floor plans out of the PDFs at full quality, cull to the strongest set per project (hero, gallery, masterplan, plans), and convert each to the site's responsive image formats with written alt text. The brochures also become downloads on each page.

## Phase 3 — Database

New tables for real projects, replacing the fictional file fixtures: project record, unit types with size and bedroom ranges, payment stages in order, floor plans, media with alt text and ordering, documents, and the compliance block (office registration, broker number, permit number, permit expiry, authority QR, validation state). Public visibility requires both a published state and a passing compliance record — a project cannot leak out half-ready. Enquiries gain a link to the project they came from.

## Phase 4 — The project pages

Rebuild the off-plan detail page against real data: hero, gallery, overview, location, unit mix table, sizes, payment plan timeline, handover, amenities, floor plans, brochure download, specifications, compliance strip, assigned consultant. The three fictional projects and their preview-only plumbing are removed.

## Phase 5 — Off-plan index and homepage

The off-plan page lists the two real projects. A featured block on the homepage carries them both. Navigation, sitemap and internal links updated.

## Phase 6 — Enquiries

Real enquiry forms on each project page, with the project attached: lead saved, scored, admin notification and client confirmation emailed, WhatsApp and call actions live, tracking fired. Reuses the existing lead pipeline.

## Phase 7 — Search visibility

Per-project titles, descriptions, social cards, structured data for a residential development and its offers, FAQ blocks answering the questions buyers actually ask, and links between projects, the developer profiles and the relevant market pages.

## Phase 8 — Check and ship

Full pass: pages render on phone and desktop, forms create real leads and emails, images load fast, headings and alt text are sound, no fictional content remains, compliance gate proven to block an unapproved project. Then commit.

---

## Technical notes

- New Supabase migration adding `commercial_projects`, `commercial_project_unit_types`, `commercial_project_payment_stages`, `commercial_project_floor_plans`, `commercial_project_media`, `commercial_project_documents`, plus a nullable `commercial_project_id` on leads. Grants for `anon` (public read of published+compliant rows only), `authenticated` and `service_role`; RLS policies enforce `publication_state = 'public' AND compliance_status = 'passed'`.
- Images and brochures uploaded to Supabase Storage (public bucket for renders, existing `brochures` bucket for PDFs); no large binaries committed to the repo.
- `src/data/off-plan.ts` fixtures, `demo-access.functions.ts` gating and `DemoEnquiryForm` are deleted; `src/routes/off-plan/$slug.tsx` and `index.tsx` load from the database via server functions.
- `PrivateInventoryForm` is retained for the "tell us what you want" path; project pages use `QualifiedForm` with a project-scoped `sourceDetail`.
- `src/config/pages.ts` and `src/config/navigation.ts` updated; sitemap emits project slugs; `noIndex` removed for real pages.
- Nothing in the DLD directory or market intelligence schema, migrations or RPCs is touched.

## What I need from you

- Advertising permit number, permit expiry, your office registration number and the responsible broker's number for each project.
- Starting prices and current payment plan, if the brochures do not state them.
- Whether Sobha City should be one page or four (master plus The Orchard, The Terraces, River Cove).
