# Phase 1B — supported Lovable Cloud publication path

Status: documented only. No Lovable Cloud or remote Supabase operation was performed.

The repository is linked to Lovable project `mfzcsjydwchikmgsqaex` through `.lovable/project.json`. The app uses a Supabase-compatible Lovable Cloud backend, but this workspace has no local PostgreSQL, Supabase CLI, or Docker runtime.

## User-run publication sequence

1. Review and approve Phase 1B locally. Commit and push only after approval so Lovable's GitHub two-way sync receives the route, data-layer and migration files. Do not rewrite published history.
2. In Lovable, open **Cloud** and confirm whether this existing project already has separate **Test** and **Live** environments. The feature is no longer available to newly enable on projects that did not already have it as of 24 March 2026.
3. If Test exists, switch Cloud to **Test**. Ask Lovable to inspect and apply these files in timestamp order:
   - `20260904010000_dld_directory_foundation.sql`
   - `20260904010100_dld_directory_atomic_import.sql`
4. Review every proposed SQL action before authorizing it. Confirm both migrations complete, the canonical tables are not publicly selectable, public views/RPC work as anon, and the search index is populated only after publication.
5. Upload only the sanitized entity Parquet outputs from `data/dld/directory/phase1a`; never upload the raw DLD exports, local DuckDB, private reports, or `search_index.parquet`. In Lovable's project permissions, database code execution requires **Read database** and **Add data** to be explicitly allowed.
6. Tell Lovable to create one `dld_directory_import_runs` row using `reports/dld/phase1a/summary.json`, upsert each sanitized entity into `dld_directory_stage` on `(import_run_id, entity_type, source_key)`, compare staged counts, and call `publish_dld_directory(import_run_id)` once. Do not ask it to insert directly into canonical tables.
7. In Test, verify all expected counts, exact English/Arabic/number searches, empty states, private-field exclusion, anon denial on internal tables, and the four nullable curated bridge columns. The bridge values themselves remain null until a separately reviewed DLX-to-DLD matching task.
8. When publishing code/schema from Test to Live, remember that Lovable syncs safe schema changes but does **not** copy database rows. After the Live schema is confirmed and backed up, repeat the sanitized staging/import procedure explicitly against Live.
9. Only then publish the frontend and smoke-test every `/directory` route. A failed or unavailable backend must show the safe empty state rather than expose or invent data.

If Test/Live is not already enabled, do not experiment on the single Live database. Use Lovable's SQL review flow, require its automatic/manual backup controls, and apply schema plus data only during an approved maintenance window. A separate duplicate Lovable project is the safer rehearsal option.

## Official references reviewed

- Lovable Test and Live environments: https://docs.lovable.dev/features/environments
- Lovable file analysis and database import permissions: https://docs.lovable.dev/features/generate-files
- Lovable GitHub synchronization: https://docs.lovable.dev/integrations/github
- Lovable Cloud deployment and ownership options: https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership
- Lovable Cloud migration-file behavior: https://docs.lovable.dev/tips-tricks/external-deployment-hosting
