# Phase 1B — migration hardening review

Status: statically and unit validated; not applied to PostgreSQL because no local PostgreSQL, Supabase CLI, or Docker runtime was already available.

## Findings and changes

- Canonical identities remain deterministic text keys from the sanitized Phase 1A build. Every canonical table has a primary key; projects, permits and free-zone licence numbers also retain source-level unique constraints. Repeating broker-office relationships use `(broker_id, source_office_id)`, and staging uses `(import_run_id, entity_type, source_key)`.
- Staging retries now upsert on that composite staging key. `--run-id` allows a failed transfer to resume without creating duplicate rows.
- Publication serializes with a transaction-scoped advisory lock, validates allowed entity types and expected row counts, defers foreign keys, replaces the full snapshot, refreshes search, and marks the run published in the same transaction. Any error rolls the whole transaction back. Recalling an already-published run is a no-op.
- Curated `areas`, `developers`, and `projects` receive nullable bridge columns only. Their content is never updated. The bridge constraints are deferred `ON DELETE NO ACTION`: publication aborts and rolls back if a new official snapshot would strand an existing curated bridge instead of silently clearing it.
- Canonical, staging, import-run and materialized-search objects have RLS enabled or explicit public revocation as applicable. Only `service_role` can stage or publish.
- Public views use explicit security barriers and fixed column lists. Phone, email, fax, nationality/demographic fields, participant IDs, matching aliases, unmatched identifiers, office hierarchy identifiers, and owner-association coordinates are absent.
- The materialized search index is private. Anonymous/authenticated users can execute only the safe search RPC or select the public search view. The RPC returns a fixed public projection and cannot accept a table or column name.
- Search has a unique identity index, a trigram alias index, exact-number priority, normalized English/Arabic matching, type filters, bounded page size and deterministic ordering.
- Related search context is built only through matched nullable foreign keys. Unmatched source identifiers remain in canonical internal columns and never appear in the public response.
- Both migration files are additive. There are no drops of existing application objects and no updates/deletes against curated DLX tables.

## Remaining execution limitation

SQL syntax, transaction semantics, RLS behavior, grants, query plans and rollback under a real PostgreSQL engine were not integration-tested. Before production, apply both migrations to Lovable Test (if already enabled) or another disposable Supabase-compatible database and execute the checklist in `PHASE-1B-LOVABLE-CLOUD.md`.
