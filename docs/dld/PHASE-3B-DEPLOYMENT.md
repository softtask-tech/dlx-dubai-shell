# Phase 3B deployment and transfer proposal

Status: documentation only. No migration or remote system was created or used.

## Architecture comparison

| Option | Assessment |
| --- | --- |
| A. Private facts and aggregates in Supabase | Highest storage, privacy and RLS burden; not recommended initially. |
| B. Private facts in object storage, aggregates in Supabase | Viable for managed recurring processing after secure storage and orchestration are designed. |
| C. Private facts offline, aggregate package only | Recommended now; minimizes remote private data and public attack surface. |

The local private database is approximately 1.80 GB. Approximate allocated
blocks are 72.9 MB for transaction facts, 422.8 MB for rent contract facts,
222.8 MB for rent lines, 19.7 MB for aggregate cells, 67.9 MB for private metric
states and 16.8 MB for sanitized aggregate rows. The complete sorted sanitized
JSONL contains 854,251 rows, is 552,924,623 bytes, and has SHA-256
`0fd63f89936be3449d70d9918c7459ddf38acd863dc1e0dcd3ad80102db673fb`.

The representative successful rebuild completed in 281.244 seconds. A second
byte-comparison run completed under a prolonged desktop scheduling pause and
reported 3,484.873 seconds; its aggregate bytes still matched exactly. Peak
recorded process working set on that run was 4,165,275,648 bytes. Representative
warm query latencies were approximately 17-30 ms for bounded Dubai, community
and project reads. Replacement cost is a full rebuild because the supplied
exports are snapshots, not increments. An idempotent same-package check is a
no-op.

## Proposed portable package

Do not upload the current ignored JSONL. A future approved package should:

1. Select only the approved metric/entity/period scope.
2. Sort by domain, entity, segment, period and metric.
3. Split UTF-8 JSONL into deterministic chunks no larger than 4 MB.
4. Include per-chunk row count, bytes and SHA-256 in a manifest.
5. Bind schema version, methodology, source package hash and export date.
6. Reject unknown fields, blocked metrics, cells below 10 and invalid
   completeness/confidence states before staging.
7. Publish a complete validated run atomically; preserve the prior run for
   rollback.

## Proposed additive database structure

Documentation only—no SQL file has been created:

- `dld_market_import_runs`
- `dld_market_aggregate_stage`
- `dld_market_aggregates`
- `publish_dld_market_aggregates(...)`
- public aggregate views/functions exposing only the active immutable run

Future RLS must deny browser access to import/staging tables. Publication must
validate manifest/hash/count/schema, allowed metrics, observation thresholds,
entity keys, methodology and period rules inside one transaction. The public
surface must never expose private facts, quarantine references or omitted
small-cell existence.
