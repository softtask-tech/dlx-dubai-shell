# DLD Phase 1A checklist - searchable directory foundation

- [x] Reassess the working tree and remove unverified, out-of-scope Phase 1 market/UI work.
- [x] Preserve verified Phase 0 reports and the read-only local DuckDB database.
- [x] Restrict the build to the eleven approved directory datasets.
- [x] Design normalized official directory tables separate from curated DLX tables.
- [x] Preserve official identifiers and bilingual source names without inferred endorsements.
- [x] Add nullable curated-to-DLD link columns without changing curated content or publication state.
- [x] Define public professional-verification fields and internal-by-default fields.
- [x] Define the universal-search data contract and normalized aliases.
- [x] Generate sanitized deterministic Parquet outputs locally from DuckDB.
- [x] Prepare additive, unapplied Supabase migrations with RLS and public views.
- [x] Create a dry-run-first staging importer and atomic publish contract.
- [x] Test row counts, unique keys, relationships, bilingual/number search, privacy, and idempotency.
- [x] Verify Phase 0 remains unchanged (160 checks, including source hashes).
- [x] Stop before Phase 1B, Supabase access, credentials, commit, push, or deployment.
