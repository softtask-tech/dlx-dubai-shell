# DLD Phase 0 checklist

- [x] Read `AGENTS.md`, `CLAUDE.md`, existing DLD scripts, and data-source guidance.
- [x] Confirm source-folder scope and keep it read-only.
- [x] Read and normalize all 25 Excel attribute dictionaries.
- [x] Inventory all 62 source files with hashes, sizes, and dataset assignments.
- [x] Profile row counts, schemas, date ranges, nulls, duplicates, and candidate keys.
- [x] Test relationships among areas, developers, projects, brokers, offices, licences, and permits.
- [x] Determine and document the correct rent-contract identity.
- [x] Classify fields as public, aggregate-only, or internal.
- [x] Add repeatable DuckDB/Python scripts under `scripts/dld`.
- [x] Generate documentation and machine-readable reports.
- [x] Verify report completeness, consistency, and source-folder immutability (160 checks passed).
- [x] Stop after Phase 0; do not write to Supabase, commit, push, or deploy.
