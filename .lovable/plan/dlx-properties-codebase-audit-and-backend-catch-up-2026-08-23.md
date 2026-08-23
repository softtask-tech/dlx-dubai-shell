# DLX Properties — codebase audit and backend catch-up

## Part A — What the code already contains (verified)

The repo is merged up to pull request #8 plus one work-in-progress commit. Every phase of the build is present in code:

| Phase | Merged work | State in code |
| --- | --- | --- |
| 1 | Scaffold: design tokens, header/footer, hero, custom cursor, base components | Complete |
| 2 | Core pages, lead pipeline, admin inbox, content CRUD | Complete |
| 3 | DLD data engine and market intelligence pages | Complete |
| 4 | Tools/calculators layer, playbook guides, journal (blog) with admin editing | Complete |
| 5 | AI advisor (chat + voice, one guarded brain), knowledge source, per-page social cards, SEO audit | Complete |
| 6 | Paid media: server-side conversions, spam filtering, lead routing, campaign landing pages, native form ingest, nurture, ROAS dashboard | Complete |
| 7 | Five-language publishing (EN/AR/HI/RU/ZH), hero rendered without waiting for JavaScript | Complete |

## Part B — What the live backend is missing (verified)

The database currently holds only the Phase 1–2 tables: agents, areas, blog_posts, developers, guides, lead_notes, leads, projects, properties, testimonials, user_roles.

Six migration files sit in the repo unapplied:

1. `dld_data_engine` — dld_transactions, dld_rent_contracts, area_stats, area_price_history, dld_ingest_runs, report_grants (grants and RLS already written correctly).
2. `area_stats_refresh` — the `refresh_area_stats()` and `link_transactions_to_areas()` functions.
3. `schedule_dld_sync` — `app_settings`, `trigger_dld_sync()` and two scheduled jobs.
4. `advisor` — `advisor_conversations`.
5. `paid_media` — 24 new columns on `leads` (routing, outcome, first-touch attribution, click ids, dedupe, spam verdict) plus `campaign_spend` and `conversion_events`.
6. `schedule_nurture` — the daily lead-nurture job.

Consequences right now: market intelligence, gated reports, the advisor log, the ROAS dashboard and the paid-media lead columns all read or write tables and columns that do not exist. Lead submission writes `fbc`, `dedupe_key`, `spam_score` and similar — those inserts fail today.

Edge functions: only `send-lead-emails` is deployed. `sync-dld-data`, `advisor-call-summary` and `lead-nurture` exist in the repo but are not deployed.

## What I'll do

1. Apply the six pending migrations in order, splitting the cron/scheduling parts out so they only run once their configuration exists.
2. Re-check permissions on every new table after applying, and fix anything the linter flags.
3. Deploy `sync-dld-data`, `advisor-call-summary` and `lead-nurture`.
4. Record the scheduling configuration (function URL and shared secret) so the DLD sync and nurture jobs can actually fire, and note which keys are still missing.
5. Refresh generated types so the new tables and lead columns are typed, and retire the hand-written `paid-media-types` stand-in if the generated types now cover it.
6. Verify: load home, properties, market intelligence, tools, guides, blog, admin leads and admin ROAS, and confirm a test lead submission saves end to end.

## Keys still needed from you

- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_ADMIN_EMAIL` — lead and nurture emails.
- Dubai Pulse / DLD credentials — the market data sync.
- Meta Conversions API token and pixel id, Google Ads conversion credentials — server-side conversions.
- Fish Audio key — the voice advisor.

Anything not supplied stays stubbed behind its environment variable: the feature no-ops rather than breaking the site.
