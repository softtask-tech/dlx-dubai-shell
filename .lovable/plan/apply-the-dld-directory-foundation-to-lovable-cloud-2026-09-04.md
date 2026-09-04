# Apply the DLD Directory Foundation to Lovable Cloud

Both new migration files are present in the repo and have been read end to end. Neither has been applied yet — none of the directory tables exist in the live database, the trigram extension is not installed, and the three bridge columns are not on `areas`, `developers` or `projects`.

## Review findings (verified before planning)

- **Additive only.** Across both files there is no `DROP`, `TRUNCATE`, `RENAME`, `UPDATE` or `DELETE` against any existing table. Every create uses `if not exists` / `create or replace`. The only deletes live inside `publish_dld_directory()`, and they only clear the DLD directory tables the migration itself creates.
- **Curated content untouched.** The only change to existing tables is three nullable columns (`areas.dld_directory_area_id`, `developers.dld_directory_developer_id`, `projects.dld_directory_project_id`). No default, no backfill, no row is rewritten. Their foreign keys are `on delete no action deferrable initially deferred`, so a future snapshot refresh aborts rather than silently clearing a curated link.
- **Anonymous exposure.** All 13 canonical tables get RLS enabled, all privileges revoked from `public`/`anon`/`authenticated`, `service_role` full access, and an admin-only policy via `has_role`. Anonymous readers get only the 13 `dld_directory_*_public` views, `dld_directory_search_public`, and `execute` on `search_dld_directory(...)`. Staging tables, import runs and the search index materialized view are all revoked from anon.
- **Private fields.** No public view or the search projection selects phone, email, fax, nationality/demographic fields, participant IDs, aliases, unmatched source identifiers, owner-association latitude/longitude, or internal matching columns.
- **Compatibility spot-checks.** The dynamic `format('... public.dld_directory_%I ...')` loops resolve to valid unquoted identifiers on this server; `has_role` exists with a matching signature; the `extensions` schema exists for `pg_trgm`. No design change is anticipated.

## One expected behaviour to handle

The search index is created `with no data`. Postgres raises an error on any read of an unpopulated materialized view, so the very first anonymous search would fail rather than return nothing. After migration 2 I will run a single `refresh materialized view public.dld_directory_search_index` — with no staged data this creates zero rows and no records, it only makes an empty directory read as genuinely empty. This is not a change to the migration design.

## Steps

1. Apply `20260904010000_dld_directory_foundation.sql` exactly as written. Stop and report verbatim on any error.
2. Apply `20260904010100_dld_directory_atomic_import.sql` exactly as written. Stop and report verbatim on any error.
3. Refresh the (empty) search index once so empty reads succeed.
4. Verification queries (read-only):
   - all 13 canonical tables have RLS on and zero privileges for `anon`/`authenticated`;
   - the 14 public views and the RPC are granted to `anon`;
   - staging, import-runs and search-index objects are not granted to `anon`;
   - no forbidden column name appears in any public view definition;
   - the three bridge columns exist, are nullable, and every existing `areas`/`developers`/`projects` row still has its original values with the bridge left null;
   - existing tables (properties, leads, agents, market data, editorial) unchanged in row count.
5. Function tests with empty staging only: call `search_dld_directory` with an empty query, a text query, a type filter and paging — expect zero rows, no error. Create one import run with zero expected counts, call `publish_dld_directory`, confirm it publishes cleanly against empty staging and is a no-op on re-call, then remove that test run. No directory records are created at any point.
6. Run the repo's Phase 1B static verifier and the security linter, and report anything it flags (Supabase commonly flags non-invoker views — this is the intended design here).
7. Render check: load the site and every `/directory` route in a browser and confirm safe empty states rather than errors, plus the existing pages still render.

## Final report will cover

Per-migration applied status, any compatibility change (expected: none), the full list of tables/views/functions/bridge columns created, RLS and grant test results, site build/render status, directory empty-state results, and the supported secure import path for your sanitized local data — staging through `dld_directory_stage` plus one `publish_dld_directory(run_id)` call, executed from the Cloud side so the service-role key never leaves the backend and is never shared with you or placed in Git.
