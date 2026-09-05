# Phase 3C compact market publication contract

Phase 3C reduces the private Phase 3B cube to a deliberately bounded public product dataset. Private facts stay offline. The transfer package is ignored by Git and contains sanitized aggregates only.

## Scope and wording

The machine-readable registry is `scripts/dld/phase3c_scope_registry.json`. Every rule names its entity grain, period grain, metric, segment, threshold, product consumer, and SEO purpose. The generator rejects everything outside those rules.

- Dubai: monthly, quarterly, and annual totals plus approved existing/off-plan, apartment/villa, and new/renewed breakdowns.
- Communities: total monthly activity; total quarterly trends and median registered annual rent; bounded annual composition.
- Projects and developers: quarterly and annual registered sale counts only, using exact safe public DLD identifiers.

Copy must say “registered sale transactions,” “registered rental contracts,” and “median registered annual rent.” These measures are neither asking rents nor investment performance. New and renewed contracts are distinct.

Only periods ending before the source export period are public. Series begin on 2010-01-01. Counts require at least 10 observations; amount and change metrics require at least 30. Phase 3B already requires both current and comparison cells to pass for a change row.

## Publication and security

The unapplied migration `20260906010000_dld_market_compact_publication.sql` adds private import-run, registry, staging, canonical, and active-publication tables. Base tables have RLS and no anon/authenticated grants. Import and publication functions require `service_role`. The public surface is a fixed sanitized view plus bounded RPCs; no raw payload or general-purpose analytics endpoint exists.

Staging is idempotent on `(import_run_id, aggregate_key)`. Validation checks schema version, manifest totals and grouped counts, scope, thresholds, completed periods, metadata, key derivation, safe identities, and exact directory matches for projects/developers. Publication takes an advisory transaction lock and switches the active run only after the canonical insert succeeds. An exception rolls back the transaction. Re-publishing returns `already_published`; service role can reactivate an earlier published run.

## Public functions

- `get_dld_market_overview(text[], text, date, date, integer)`
- `get_dld_market_entity_series(text, text, text, text, date, date, integer)`
- `compare_dld_market_communities(text[], text, text, date, integer)`
- `search_dld_market_entities(text, text[], integer, integer)`
- `get_dld_market_metadata()`

Inputs are capped to 10 metrics, 20 community IDs, three entity types, 100 query characters, 20 years, and bounded result/offset limits. Rows carry observation count, confidence, source date, and methodology.

## Decisions before application

1. Apply and test in an isolated local Supabase/PostgreSQL environment, including `EXPLAIN (ANALYZE, BUFFERS)` for each RPC. PostgreSQL was unavailable during this offline checkpoint.
2. Confirm public wording and consumers with editorial/compliance owners.
3. Confirm Lovable’s approved service-side CSV staging mechanism and persist package/manifest hashes.
4. Activate the directory first: project/developer validation depends on its canonical records.

## Developer-identifier corrective release

The original package serialized 7,948 developer rows across 727 official
developer numbers with a `.00` suffix. The corrective generator now reads the
authoritative `developer_number`, trims only surrounding whitespace, validates
it using exact decimal arithmetic, and emits positive integral values as plain
base-10 integer text. It rejects fractional, zero, negative, non-finite,
nonnumeric, punctuated, embedded-whitespace, and scientific-notation forms.

- Previous ZIP SHA-256: `f18884565a37d56b04ff5406ae11ff844d6f8b7de9be25c3b0b7934ef0dc9a84`
- Corrected ZIP SHA-256: `d526b997241ba9211dcb1d713203eb432b521a34fc05209d38f33d6cea8cee90`
- Previous manifest SHA-256: `f6492b17ea6c497f40714294677185e9a0591d338057c3228dddf1f21bee04d6`
- Corrected manifest SHA-256: `0507b2938d5db7378ae3fec27eee980782bf77d0a899a77d6322ea500138132a`
- Corrected ZIP size: 5,782,531 bytes; 108,982 rows in seven chunks.

All 727 corrected identifiers resolve exactly once in the Phase 1A developer
registry. The baseline comparison proves all non-developer rows are identical
and that developer values, observations, periods, confidence, and quality flags
are unchanged. Only the 7,948 developer entity IDs and their derived aggregate
keys changed semantically.
