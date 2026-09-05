# Phase 3 — DLD Market Intelligence, end to end

Publish the sanitized market aggregates to the backend and turn the existing Market Intelligence page into a real, data-backed section of the site. No redesign of unrelated pages.

Already confirmed: the uploaded package is 5,782,921 bytes and its SHA-256 matches the expected value exactly, and the migration `20260906010000_dld_market_compact_publication.sql` is present in the repo and not yet applied.

## Stages

**A — Check the package (offline).** Verify archive safety, manifest hash, all 7 chunk hashes and row counts, the 17-field schema, 108,982 rows, and every scope/threshold/privacy rule (no prices, no yields, no per-square-foot, no personal or contract-level fields). Confirm the entity and period breakdowns given. Any mismatch stops everything.

**B — Apply the migration exactly as committed.** Then confirm row-level security is on, that anonymous visitors cannot touch staging, import runs, canonical aggregates or internal config, that import/validate/publish/rollback are service-role only, and that exactly the five public read functions are callable. Earlier directory permissions must be unchanged.

**C — Synthetic tests before real data.** Exercise every failure path (bad manifest, wrong fields, invalid metric/grain/segment, small samples, incomplete periods, duplicate keys, count mismatch, forced publication failure and rollback, repeat staging, repeat publication, anonymous denial, out-of-bounds parameters), run query plans to confirm index use, then delete all test data and prove the tables are empty again.

**D — Stage the real package.** One import run carrying the package and manifest hashes, schema and methodology versions, source export date and expected counts. Chunks staged server-side in resumable, idempotent batches; reconcile to exactly 108,982 distinct keys; run full server-side validation; delete extracted temporary files. Nothing extracted is written to Git, frontend assets or public storage.

**E — Publish atomically.** Re-validate, call the publication function once, verify status, timestamps, active pointer, hashes and exact counts, then call it again to confirm a no-op with no state change.

**F — Verify the five public functions** as anonymous and signed-in callers across overview, series, comparison, search (Arabic and English), boundaries, limits and every invalid-input case. Capture real timings and plans; target under 500 ms warm, ideally under 250 ms for common views. Any shortfall gets a separate additive optimisation migration — the applied one is never edited.

**G — Market Intelligence pages.** Wire the existing experience to the live data:
- `/market-intelligence` — latest complete period, registered sale activity, registered rental contracts, new vs renewed composition, median registered annual rent, freshness, methodology, source line, links to communities and guides.
- Community view — search/select, trends, quarterly comparison, annual composition, observation counts, confidence, honest "not available / too few records" states, area-guide and enquiry links.
- Project and developer views — registered sale counts only, exact official matches, explicit wording that activity is not a measure of quality or returns.
- Comparison view — bounded community selection, shared period and metric, accessible table alongside the chart, shareable but bounded URL state.

Wording follows the approved list ("registered sale transactions", "median registered annual rent", "Source export: 4 September 2026", independence from DLD, informational only). The forbidden phrases (ROI, yield, price per square foot, best developer, primary/secondary, asking price) appear nowhere.

**H — Charts.** Real data only, honest axes, units, period and observation count, tooltips, keyboard and touch support, accessible data tables, Arabic preserved, unavailable states instead of invented values, reduced-motion support, and only the bounded series each view needs — never the full dataset in the browser.

**I — SEO/AEO.** Unique titles and descriptions, canonicals on dlxproperties.com, server-rendered copy, breadcrumbs, export and updated dates, methodology link, internal links, Dataset/WebPage/ItemList structured data, Open Graph. Only substantive community pages are indexable; no thin project/developer pages, no indexed comparison permutations; sitemap and `llms.txt` updated.

**J — Lead capture.** Contextual, quiet actions (ask about this community, request matching opportunities, discuss an objective, ask the advisor) carrying page, entity, period/metric, language, attribution and consent. No claim of personalised advice. No voice work in this phase.

**K — Verification.** Types, lint on changed files, unit/route/directory/privacy tests, production client and server builds, browser checks at desktop/tablet/mobile, chart accessibility, empty and error states, Arabic rendering, SEO crawl, canonical/sitemap/robots, structured data, performance, secret scan, whitespace check.

**L — Release.** Commit normally to main through the usual sync, verify the preview, and let the existing deployment workflow run. No history rewriting, no new deployment mechanism.

## Technical notes

- Data access goes through server functions using the generated admin/publishable clients; the five public functions are called with the anon client where anonymous reads are correct. No service-role key is ever exposed or requested.
- New route files: `src/routes/market-intelligence/` (index, `communities/$id`, `compare`) plus project/developer activity surfaced on existing directory detail routes rather than new thin URLs.
- New data layer: `src/data/market-public.ts` (typed RPC wrappers, bounded inputs) and a `.functions.ts` counterpart, following the existing directory pattern.
- Staging is executed backend-side via the service-role-only `stage_dld_market_rows` function in batches; extracted CSV lives only in a temporary sandbox directory and is deleted afterwards.

## Final report

Migration status, synthetic test results, import run ID, package/manifest hashes, staged and published counts, idempotency result, permission tests, RPC timings and plans, routes and components changed, SEO/AEO behaviour, accessibility and responsive results, test and build results, commit hash, preview/deploy status, remaining blocked metrics, and confirmation that no private facts were uploaded and no market figure was fabricated.
