# DLD Phase 1D sanitized import instructions

This package is for the additive `dld-directory-transfer/1` contract implemented
by `20260905010000_dld_directory_sanitized_import.sql`. It contains no credentials,
raw DLD files, private reports, Parquet, DuckDB, aliases, contact details, personal
identifiers, source matching IDs, office hierarchy IDs, or excluded coordinates.

## Before importing

1. Verify the ZIP SHA-256 against `dld-directory-phase1d.zip.sha256`.
2. Extract the ZIP and verify every chunk's byte size and SHA-256 against
   `manifest.json`. Reject unexpected files, fields, entity types, or counts.
3. Confirm the three migrations are reviewed and applied in timestamp order. The
   Phase 1D migration must be applied only after the two Phase 1A migrations.
4. Create one `dld_directory_import_runs` row with `status = 'staging'`, the full
   manifest as `source_manifest`, and the per-entity totals as `expected_counts`.
   Copy those totals directly from `manifest.json.expected_counts`.
   The 13 manifest counts are authoritative for that snapshot; future exports may
   have different counts without requiring another migration.
   The server requires `source_manifest.expected_counts` to equal the import run's
   `expected_counts` JSON exactly.

## Staging order and resumability

Upload JSONL chunks in the manifest's `upload_order` and each entity's listed chunk
order. Each line is an envelope containing exactly `entity_type`, `source_key`, and
`payload`. Add the run UUID as `import_run_id`, then upsert to
`dld_directory_stage` on `(import_run_id, entity_type, source_key)`. Retrying an
identical chunk is safe. Never insert transfer payloads directly into canonical
tables and never send client-supplied aliases or canonical IDs.

This package's expected counts are: communities 301; developers 2,348; escrow agents 25; offices
2,574; brokers 8,709; projects 3,039; office activities 4,963; broker-office links
8,724; licences 2,948; permits 175,056; valuators 153; owner associations 110; and
free-zone companies 250. Total expected rows: 209,200.

`expected_counts` must be a JSON object containing exactly those 13 entity keys.
Unknown or missing keys, negative or non-integer values, a zero grand total, and
values above the service-controlled limits in `dld_directory_transfer_limits` are
rejected. The private limits table is deliberately larger than this snapshot but
conservative; review and adjust a limit explicitly if legitimate future growth
exceeds it. Never raise a limit merely to bypass a failed validation.

## Validation and atomic publication

Call `validate_dld_directory_sanitized(run_uuid)` as the service role and review
every returned row. Errors block publication. `unmatched_relationship` warnings are
expected for source links that could not be safely matched; their identifiers are
not present in the package and their canonical foreign keys remain null. Do not
override, discard, or guess a relationship.

After zero errors and exact counts, call
`publish_dld_directory_sanitized(run_uuid)` once. The function repeats all checks,
locks publication, derives private keys and search aliases from approved fields,
resolves relationships, replaces the canonical snapshot, refreshes the private
search index, records a server-computed SHA-256 of canonical `source_manifest` JSON
in `manifest_sha256`, and marks the run published in one transaction. Any schema, count,
cast, collision, relationship, constraint, or refresh failure rolls back the entire
call. Calling it again for an already published run is an idempotent no-op.

## Rollback and post-publication checks

On a failed call, correct or re-upload staged rows under the same staging run and
repeat validation. The prior canonical snapshot remains intact. Do not mark failed
runs published manually. For operational rollback after a successful publication,
stage and publish a previously retained, verified package as a new run; never edit
canonical tables piecemeal.

After publication, verify all canonical and public-view counts, sample English and
Arabic searches, exact developer/broker/project/licence/permit numbers, relationship
warning totals, null unmatched links, and anon denial on canonical staging/import
tables. Confirm public views and search results contain none of the prohibited
fields. The search materialized view is rebuilt server-side and is never uploaded.

## Current unmatched relationship audit

The source-aware audit covers all 184 unmatched links: 13 broker-office office
references, 10 project-developer references, and 161 project-escrow references.
Every available official number has zero matches in its corresponding parent
snapshot. Two project-developer rows have no developer number; the remaining source
names are not stable registration identifiers and are therefore insufficient for a
safe link even when a name happens to be unique in this export. The transfer omits
all unmatched numbers/names, marks each relationship `unmatched`, publishes a null
foreign key, and retains one `unmatched_relationship` entry per link in
`validation_report`. Name or alias similarity must never be used to guess them.
