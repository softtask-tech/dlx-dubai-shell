# Phase 1D — stage and validate the sanitized directory package

Load the uploaded package into the backend staging area and run the validation routine. Nothing is published, and nothing the public site reads is touched.

## What the package contains (already inspected, read-only)

- ZIP checksum matches the supplied value exactly: `6f6de7d4…37e3`, 16,087,773 bytes.
- 44 entries: `manifest.json`, `IMPORT-INSTRUCTIONS.md`, and 42 data chunks — no unexpected paths or file types.
- Manifest format `dld-directory-transfer/1`, 13 entity groups, 209,200 rows total, matching the counts you listed.

## Steps

1. **Verify before extracting** — re-check the ZIP checksum, then extract to a temporary working folder outside the project (never into the repository, the site, or version control).
2. **Reject anything unexpected** — confirm every extracted file is listed in the manifest, that no extra files exist, that paths are flat and safe, and that only `.jsonl` data chunks plus the two documents are present.
3. **Check every chunk** — verify each of the 42 chunks against its manifest byte size, checksum and row count, and confirm each line carries exactly the three expected fields (record type, key, payload) with the record type matching its file.
4. **Create one import run** — a single staging run holding the package's format version, the full manifest, and the 13 per-entity totals copied verbatim.
5. **Stage the rows** — upload in the manifest's stated order, entity by entity and chunk by chunk, in resumable batches. Each row is written against the run/entity/key uniqueness rule, so a retried or repeated batch updates rather than duplicates. Progress is checked after each entity so an interruption can resume from where it stopped.
6. **Reconcile counts** — compare staged rows per entity against the expected totals, and report duplicates and rejects.
7. **Validate** — run the validation routine for the run and read every returned row.
8. **Stop on any error** — if the routine reports an error, halt immediately, change nothing, and report the exact finding.
9. **Preserve warnings** — the 184 expected unmatched-link warnings (13 broker-office, 10 project-developer, 161 project-escrow) are kept as-is and reported grouped by relationship type. No link is guessed or overridden.
10. **Confirm nothing else moved** — verify all 13 published record tables, the public views and the search index are still empty and unchanged, and that the publication routine was never called.

## Checkpoint report

Import run ID; verified package and manifest checksums; staged vs expected count per entity; rejected and duplicate counts; validation errors; validation warnings grouped by relationship type; confirmation that published and public tables are unchanged; confirmation that publication has not been called.

## Technical notes

- All work happens server-side against the connected backend. The service-role key is never read, printed, or requested; the package never enters Git or frontend assets.
- Staging writes go to `dld_directory_stage` keyed on `(import_run_id, entity_type, source_key)`, with `import_run_id` added to each envelope; payloads are never written to canonical tables.
- The run row sets `status = 'staging'`, `source_manifest` = the full manifest (whose `expected_counts` must equal the run's `expected_counts` exactly), and `expected_counts` = the manifest's 13 keys.
- Validation is `validate_dld_directory_sanitized(run_id)`; `publish_dld_directory_sanitized` is **not** called in this pass.
- Bulk loading is done through the managed database connection in batched transactions; if that path cannot write to the private staging table, the fallback is the backend SQL tool with the same upsert contract.
- Working files are removed from the sandbox afterwards.
