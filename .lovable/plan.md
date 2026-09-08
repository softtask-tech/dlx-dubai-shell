# Catch up the live backend with the latest merged code

## What I checked

The newest merge (pull request #32) brings one unapplied database change and one new data file. Everything else in the repository is already live.

- Unapplied: `20260908010000_dld_market_price_metrics.sql` — it opens up sixteen new market figures (price per square foot, typical sale price, rent per square foot, service charge, gross yield). The live permission list has none of them yet.
- New data: `reports/dld-aggregates/market_aggregates_2026-09-08_all.csv`, 16,922 rows built from the raw Land Department files.
- Live market data today: 108,982 rows covering only sales counts, tenancy counts and median annual rent. Pages that show prices and yields therefore have nothing to read.
- The four backend jobs (lead emails, nurture, market sync, call summary) are unchanged since they were last deployed. No redeploy needed.
- The lead email key (`RESEND_API_KEY`) is still not set, so lead emails stay in safe no-send mode.

## Three issues the new data has to clear first

1. **The whole picture has to be published at once.** The site reads one published set at a time. Publishing only the new file would make the existing counts and rents disappear. So the new figures and the existing 108,982 rows must be republished together as a single set.
2. **610 rows cover periods that have not finished** (the current quarter, and 2024–2025 service charges are absent while 2026 ones are not). The rules correctly refuse part-finished periods, so those rows are dropped.
3. **15 rows are filed under a placeholder community called "Unspecified".** Those are dropped rather than shown as a real place.

## What I'll do

1. Apply the pending migration so the new figures are permitted.
2. Prepare the combined set: existing published rows plus the new file, minus the unfinished periods and the placeholder community, all under one methodology stamp with keys recalculated the way the rules require.
3. Stage it in batches, run the built-in validation, and publish it in one atomic switch. If validation fails, nothing changes — the current data stays live.
4. Check the live pages afterwards: market intelligence, an area page, the yield and best-area tools, and the gated report view, confirming the new price, rent, service charge and yield figures appear with their "Updated · Source: Dubai Land Department" stamp.
5. Report what is still waiting on keys from you (lead emails via Resend; Land Department sync credentials).

## Technical notes

- Combined run: new `dld_market_import_runs` row, `schema_version dld-market-transfer/1`, `methodology_version dlx-aggregates-2`, `source_export_date 2026-09-08`, with `expected_counts` grouped by entity/grain/metric and `expected_total` matching exactly.
- Existing rows are re-keyed through `dld_market_derive_aggregate_key` under the new methodology stamp; CSV rows carry a readable key that must be replaced by the hashed one.
- Staging via `stage_dld_market_rows` in chunks of 5,000, then `validate_dld_market_import`, then `publish_dld_market_import` (advisory-locked, flips `dld_market_publication_state` in the same transaction). The previous run stays intact for rollback via `activate_dld_market_publication`.
- No schema, RLS or grant changes beyond the scope-registry inserts in the pending migration.
