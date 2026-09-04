# Phase 1D — apply the sanitized import migration and test it with fabricated records

The new migration file is in the repo and reviewed. It is additive: it adds two optional columns to the existing import-run log, creates one new private settings table, and creates five new functions. It does not drop, rename or truncate anything, and it does not touch properties, leads, agents, market data or editorial content.

No real directory data will be imported in this phase.

## What will happen

1. Apply `20260905010000_dld_directory_sanitized_import.sql` exactly as it stands in the repo, with no edits. If PostgreSQL raises any error, stop immediately and report the full error text without changing the file.
2. Confirm it is recorded in the migration history alongside the two already-applied DLD migrations.
3. Run permission checks as an anonymous visitor and as a signed-in visitor:
   - the new limits table must be unreachable
   - the 13 official-record tables and the staging tables must stay unreachable
   - the two new validation/publication routines must be callable only by the backend
   - the 14 public views and the search routine must still be readable by anyone and must still return nothing
4. Run a backend-only test with a handful of made-up records to prove each safeguard fires:
   - a correct manifest is accepted
   - a wrong manifest is rejected
   - a record with an extra or a missing field is rejected
   - a mismatch between promised and staged counts is rejected
   - a record pointing at a parent that does not exist is rejected
   - an unresolved link is reported as a warning, not an error
   - a forced failure mid-publication leaves the directory exactly as it was
5. Delete every made-up record and test import run, then re-check that all 13 record tables are empty and that nothing test-related is visible on the public directory pages.
6. Re-check the site builds and the directory pages still show their empty state.

## Technical notes

- The migration is applied via the migration tool in a single call, unmodified.
- Synthetic tests run server-side through SQL only. Each negative case is wrapped so the raised exception is captured and reported rather than aborting the session; the atomic-rollback case forces a failure inside `publish_dld_directory_sanitized` and then compares canonical row counts before and after.
- Because `publish_dld_directory_sanitized` clears the canonical tables before inserting, any successful synthetic publish is followed by an explicit cleanup of the 13 tables plus `dld_directory_stage` and the synthetic rows in `dld_directory_import_runs`, and the search index is refreshed back to empty.
- The service-role key is never requested, printed or moved.

## Report at the end

Migration result and version; any PostgreSQL errors; permission and public-access results; the outcome of each synthetic test; confirmation that all test data was removed; and final row counts for all 13 canonical tables.
