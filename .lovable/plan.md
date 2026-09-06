# Back on the phase plan: Phase 3 (team) and Phase 11 (SEO/AEO)

Phases 1, 4–8 are done (real company identity, DLD directory and market data, the two
projects, the lead engine). Phase 2 (redesign) was dropped by you. The two phases that were
skipped when the work drifted into design are Phase 3, the team, and Phase 11, search and
AI-answer readiness. This picks both up.

## Where things stand today

- All seven consultants are already in the database with role, BRN, languages, specialities
  and bios. Six of the seven have a BRN; Fayuros Munavvar does not. None has a photo yet.
- `/team` lists them on one page. There are no individual consultant pages, no LinkedIn
  links, and no person-level structured data.
- Search foundations are strong: unique titles, descriptions and cards per page, a dynamic
  sitemap covering guides, journal, services, tools, properties, developers, projects,
  communities and both off-plan projects, a robots file that names the AI crawlers, and an
  AI knowledge feed. What is missing is people, the two real projects as offers, and a
  crawl path into the DLD directory.

## Phase 3 — The team, properly

1. A profile page per consultant at `/team/{name}`: portrait, role, BRN, languages,
   specialities, the areas and project types they cover, their bio, and direct call,
   WhatsApp and email actions.
2. A designed monogram portrait placeholder in the brand's sand and ink, used until you send
   headshots. Consistent framing so the real photos drop straight in.
3. A short enquiry form on each profile that routes the lead to that named consultant rather
   than the round-robin queue, tagged with the page it came from.
4. The team list page links through to each profile and keeps the "you get one named person"
   promise it already makes.
5. Consultants become linkable from a project page, so "your consultant for Azizi Florence"
   is a real link.
6. Where a consultant has no BRN on file, the page simply omits it rather than inventing one.

## Phase 11 — SEO and AEO

1. Person and employee structured data for each consultant, tied to the company record, so
   search engines and AI assistants can see who works here and what they are licensed as.
2. Project structured data for Azizi Florence and Sobha City with only the facts we hold —
   developer, community, status, source — and nothing invented about price or handover.
3. Team profiles added to the page registry, the sitemap and the internal link graph.
4. A crawl path into the DLD directory: a sitemap index plus paginated sitemaps for the
   directory records, so the 209,200 records we hold are discoverable instead of invisible.
   Capped and prioritised, not dumped in one file.
5. An `llms.txt` at the site root describing what DLX publishes, which data is official, how
   fresh it is and where the canonical pages are — the file AI assistants increasingly read
   first.
6. An orphan-page sweep: every registered page must be reachable from at least one other
   page, checked by the existing audit script and fixed where it fails.
7. Re-run the existing SEO audit against the running site and fix whatever it reports.

## What I will not do

- No redesign, no palette or type changes.
- No invented biography detail, licence number, photograph, review or project figure.
- No LinkedIn links until you send the URLs.

## Technical notes

- New route `src/routes/team/$slug.tsx` plus an index move; `/team` stays the list.
  Registered in `src/config/pages.ts` so it reaches the sitemap and OG card generation.
- `personSchema` and `employeeOf` wiring added to `src/lib/schema.ts`, emitted from the
  profile route; organisation schema in `__root.tsx` gains an `employee` list.
- Directory sitemaps served as `sitemap-directory-{n}.xml` from the existing public server
  functions, with `sitemap.xml` becoming an index that references them; the current
  page-level sitemap moves to `sitemap-pages.xml`.
- Consultant enquiries reuse `submitLeadFn` with `sourceDetail: consultant-{slug}` and skip
  `nextAgent` when a consultant is named.
- Verification: `node scripts/audit-seo.mjs`, `node scripts/check-phase2c-compliance.mjs`,
  the off-plan tests and `bunx tsgo --noEmit`.

## After this

Phase 9 (AI chat advisor), then 10, 12, 13, 14 as originally planned.
