# DLD Phase 3B deterministic market aggregation

Status: local, uncommitted review checkpoint. No application code, SQL
migration, remote connection, upload, publication, push or deployment is part
of this phase.

The pipeline reads the verified Phase 0 DuckDB through a read-only attachment
and writes private facts only under ignored `data/dld/local/phase3b/`. Tracked
reports contain schemas, aggregate diagnostics, representative sanitized
aggregate rows and verification summaries only.

## Authoritative metadata

The supplied DLD attribute dictionaries are the primary field contract:

- Transaction `procedure_area` is explicitly square metres.
- Transaction `actual_worth` is described as the property price, but no
  currency is stated. Currency-dependent sale metrics remain blocked.
- Rent `contract_amount` is explicitly in AED.
- Rent `annual_amount` is the calculated annual amount for a non-12-month
  contract. Because it derives from the AED contract amount, Phase 3B permits
  annual-rent medians, subject to sample and quality rules.
- Rent `actual_area` has no documented unit. No rent unit-price metric exists.
- Transaction registration type means Existing or Off-Plan, not primary or
  secondary market.

Official supporting sources, accessed 2026-09-06:

- Dubai Pulse DLD transaction contract:
  <https://www.gslb.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open-api>
- DLD Real Estate Data export interface:
  <https://dubailand.gov.ae/en/open-data/real-estate-data/>
- DLD Residential Sale Index:
  <https://dubailand.gov.ae/en/open-data/residential-properties-price-index-rppi/>
- DLD index methodology:
  <https://dubailand.gov.ae/media/qnslugbi/the-dubai-house-price-index-methodology.pdf>

The official transaction pages corroborate square-metre area and discuss AED
market totals, but they do not bind the export field `actual_worth` to a stated
currency. The approved unresolved status is therefore retained.

## Typed private model

The ignored DuckDB contains:

- `source_manifests_private`, `source_files_private` and
  `source_schema_fingerprints_private`
- safe bilingual lookup dimensions
- `transaction_facts_private`, one row per unique transaction
- `rental_contract_facts_private`, one row per distinct contract
- `rental_contract_lines_private`, one row per `(contract_id,line_number)` and
  deliberately no repeated contract/annual amount
- `relationship_quarantine_private` using hashed source references
- `data_quality_results`
- `residential_sale_index_private`
- `aggregate_cells_private`, `aggregate_metrics_private` and
  `public_aggregates_sanitized`
- `publication_runs_private`

The source package is identified by SHA-256
`17e79fdc966c4edc958736cc3e1d1e9dc0f59fbcdd0e614d98b725f42385a99a`
and methodology `dld-market-aggregation-phase3b-v1`.

## Transaction reconciliation

Every one of 1,776,143 transactions has exactly one economic classification:

| Classification | Rows |
| --- | ---: |
| eligible_market_sale | 1,290,990 |
| mortgage | 349,879 |
| gift | 66,189 |
| excluded_sales_procedure | 69,081 |
| invalid_date | 4 |
| other_non_market | 0 |

The four approved sale procedures are matched by exact composite `(group_id,
procedure_id)` keys: `(1,11)`, `(1,41)`, `(1,102)` and `(1,460)`. All 1,776,143
procedure/group relationships are uniquely valid. Invalid date takes precedence
over economic category, explaining the four-row difference from the Phase 3A
raw mortgage-group count.

Relationship state is independent of economic classification. All transaction
community relationships match. Project state is matched for 1,269,788 and
unmatched/missing for 506,355. Developer state is matched for 1,268,979 and
unmatched/not applicable for 507,164. Among eligible sales, 1,003,257 have a
matched project, 1,002,678 also have a matched developer, and 287,733 lack a
matched project. Unmatched project/developer transactions remain in Dubai and
matched-community aggregates but never enter the unavailable entity grain.

## Rental reconciliation

All 10,442,927 lines reconcile to 8,713,621 distinct contracts:

| Classification | Contracts | Source lines |
| --- | ---: | ---: |
| eligible | 8,701,850 | 10,429,508 |
| start_after_export | 11,630 | 13,050 |
| duration_out_of_range | 141 | 369 |

There are no unparseable or end-before-start contracts in this snapshot.
Future end dates are permitted when the start is no later than the export and
the inclusive duration is 1-3,660 days.

Eligible contracts include 246,039 multi-line contracts. Exactly 8,701,832
eligible contracts resolve every line to one safe area; 1,558,508 resolve every
line to one safe project. Fifteen contracts contain mixed areas, 11 contain
mixed projects, three lines lack a resolvable area, and 7,152,264 contracts have
at least one missing or unresolved project line. These contracts still count
once at Dubai grain when date-eligible, but geography/project amount statistics
require the corresponding single safe relationship. Repeated header attributes
are consistent for every contract. The 5,594 declared-property-count mismatches
are retained as quality flags rather than guessed corrections.

## Aggregation and suppression

Private aggregates contain 711,775 cells and 2,000,448 metric-state rows.
The sanitized table contains 854,251 rows:

| Public metric | Rows |
| --- | ---: |
| Sales count | 191,841 |
| Sales count period change | 66,926 |
| Rent count | 209,030 |
| Rent count period change | 122,169 |
| Median annual rent | 142,116 |
| Median annual rent period change | 122,169 |

There are 833,527 complete-period and 20,724 explicitly incomplete-period base
rows. Period changes exist only for complete adjacent periods where both cells
have at least 30 observations. For this export, complete periods end at August
2026, Q2 2026 and 2025. The boundary is calculated from the export date.

Cells below 10 are absent from the sanitized artifact: 234,410 private sales
count cells and 76,494 private rent count cells were omitted. Counts from 10-29
remain available with `counts_only`; value statistics require 30. All 334,383
private cells for each sale value/median/unit-value metric are blocked from
sanitized output because currency is unresolved. Gross yield, primary/secondary
and rent unit-price metrics do not exist in the artifact.

Representative rows are in
`reports/dld/phase3b/sanitized_samples.json`. They use official safe entity
names and aggregate values only, never source-row identifiers.

## Residential Sale Index

The supplied 159 source months normalize into 2,862 private series/value rows
covering all/flat/villa, monthly/quarterly/yearly and index/price-index fields.
The series remains separate from DLX-derived metrics. DLD describes a hedonic
methodology and warns against commercial pricing/investment use; it is excluded
from the proposed transfer pending legal and methodology review.

## Determinism and atomicity

The builder writes a new database and sorted JSONL to separate building paths,
then replaces the canonical local artifacts only after facts, aggregates,
reports and hashes complete. Failed builds leave the previous canonical pair in
place. The same source package and methodology returns an idempotent no-op.

Two full builds produced the identical sanitized JSONL SHA-256:
`0fd63f89936be3449d70d9918c7459ddf38acd863dc1e0dcd3ad80102db673fb`.
The DuckDB file is a private engine artifact and is validated logically by
table counts, keys and reconciliations; its physical block layout is not a
publication contract.

## Phase 3C decisions

Owner approval is required before any next phase for:

1. Accepting annual-rent publication based on the supplied DLD dictionary.
2. Confirming that incomplete base rows should transfer, clearly labelled, or
   be held privately until complete.
3. Selecting which historic entity/segment combinations are commercially
   useful; the full candidate JSONL is large.
4. Accepting deployment architecture C and the future chunked package contract.
5. Legal/compliance treatment of the official Residential Sale Index.
6. Any future authoritative evidence resolving transaction currency or rent
   area units.

No Phase 3C work begins automatically.
