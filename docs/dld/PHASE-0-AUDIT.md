# DLD Phase 0 inventory and audit

Generated: `2026-09-04T16:02:09+00:00`

Phase 0 is a local, read-only assessment. No Supabase or production writes are performed.
Committed outputs contain metadata and counts only; the source CSV/XLSX rows stay outside Git.

## Scope and headline findings

- Inventoried **62 files**: **37 CSV** exports and **25 Excel** dictionaries.
- Read **25 datasets** containing **16,521,480 source rows**.
- Detected **0 exact duplicate rows** by full-row hash across all datasets.
- Confirmed **33 candidate-key tests** as unique and non-null; all tested key results are in the machine-readable report.
- Relationship checks: **8/22** have complete non-null key coverage; partial checks retain quantitative orphan rates.
- Rent identity: `contract_id` is the contract header; **(`contract_id`, `line_number`)** is the rent-property row identity. Composite-key validity: **True**.
- The existing `contract_id`-only rent ingestion design would collapse property lines for multi-property contracts and must not be used for a production load without redesign.

## Largest datasets

| Dataset | Rows | Columns | CSV chunks | Exact duplicate rows |
| --- | ---: | ---: | ---: | ---: |
| Rent Contracts | 10,442,927 | 41 | 10 | 0 |
| Registered Freehold Real Estate Units | 2,374,726 | 47 | 3 | 0 |
| Real Estate Transactions | 1,776,143 | 47 | 2 | 0 |
| Property Map Requests | 1,021,252 | 16 | 1 | 0 |
| Land Registry | 263,663 | 32 | 1 | 0 |
| Building and Property Project Records | 256,423 | 46 | 1 | 0 |
| Real Estate Permits | 175,056 | 21 | 1 | 0 |
| Owners Association Service Charges | 91,193 | 20 | 1 | 0 |

## Rent-contract identity

- Rows: **10,442,927**; distinct contracts: **8,713,621**.
- Contracts with multiple property lines: **246,313**.
- Duplicate (`contract_id`, `line_number`) rows: **0**.
- Contract-line pairs crossing CSV chunk boundaries: **0**.
- Contracts whose declared `no_of_prop` differs from observed lines: **5,594**.

## Relationship coverage

| Relationship | Non-null child rows | Null child rows | Row match | Orphan keys | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| `projects.area_id -> areas.area_id` | 3,039 | 0 | 100.000% | 0 | pass |
| `transactions.area_id -> areas.area_id` | 1,776,143 | 0 | 100.000% | 0 | pass |
| `rent_contracts.area_id -> areas.area_id` | 10,442,924 | 3 | 100.000% | 0 | pass |
| `units.area_id -> areas.area_id` | 2,374,293 | 433 | 100.000% | 0 | pass |
| `land_registry.area_id -> areas.area_id` | 263,663 | 0 | 100.000% | 0 | pass |
| `valuations.area_id -> areas.area_id` | 90,692 | 79 | 100.000% | 0 | pass |
| `buildings.area_id -> areas.area_id` | 256,423 | 0 | 100.000% | 0 | pass |
| `projects.developer_id -> developers.developer_id` | 3,037 | 2 | 99.737% | 4 | partial |
| `projects.master_developer_id -> developers.developer_id` | 3,039 | 0 | 100.000% | 0 | pass |
| `projects.escrow_agent_id -> escrow_agents.escrow_agent_number` | 2,879 | 160 | 94.408% | 19 | partial |
| `buildings.project_id -> projects.project_id` | 148,940 | 107,483 | 88.788% | 517 | partial |
| `units.project_id -> projects.project_id` | 852,363 | 1,522,363 | 85.033% | 458 | partial |
| `land_registry.project_id -> projects.project_id` | 93,275 | 170,388 | 92.125% | 454 | partial |
| `service_charges.project_id -> projects.project_id` | 91,185 | 8 | 73.703% | 21 | partial |
| `brokers.real_estate_id -> offices.real_estate_id` | 8,724 | 0 | 99.851% | 3 | partial |
| `brokers.real_estate_number -> offices.real_estate_number` | 8,724 | 0 | 99.851% | 3 | partial |
| `offices.participant_id -> licences.participant_id` | 4,963 | 0 | 17.107% | 2,202 | partial |
| `offices.license_number -> licences.license_number` | 4,949 | 14 | 19.438% | 2,100 | partial |
| `developers.participant_id -> licences.participant_id` | 2,348 | 0 | 3.322% | 2,270 | partial |
| `developers.license_number -> licences.license_number` | 2,273 | 75 | 4.619% | 2,144 | partial |
| `permits.license_number -> licences.license_number` | 175,056 | 0 | 5.730% | 10,979 | partial |
| `permits.license_number -> offices.license_number` | 175,056 | 0 | 32.675% | 9,926 | partial |

## Date-quality flags

Dates before 1900 or from 2036 onward are retained as source values but flagged for review; the threshold is a quality screen, not a deletion rule.

| Dataset.field | Range | Before 1900 | From 2036 |
| --- | --- | ---: | ---: |
| `Developers Recorded in Dubai Land Department.license_expiry_date` | 2005-11-02T00:00:00 to 2100-10-10T00:00:00 | 0 | 3 |
| `Real Estate Licenses.expiry_date` | 0206-04-23T00:00:00 to 2029-11-23T00:00:00 | 1 | 0 |
| `Real Estate Transactions.instance_date` | 1416-07-02T00:00:00 to 2026-09-02T00:00:00 | 4 | 0 |
| `Rent Contracts.contract_end_date` | 2002-02-15T00:00:00 to 5013-05-28T00:00:00 | 0 | 1,119 |
| `Rent Contracts.contract_start_date` | 2001-02-15T00:00:00 to 2205-07-16T00:00:00 | 0 | 6 |

## Publication classification

- Public: **362** fields.
- Aggregate-only: **72** fields.
- Internal: **79** fields.

DLD's dictionaries label the exports `Open`; this audit adds a stricter product-exposure classification.
Open-data status does not mean every granular identifier, contact field, or property-level measure should be emitted by the website.

## Machine-readable evidence

See `reports/dld/phase0/` for the file inventory and hashes, normalized dictionaries, dataset and column profiles, date ranges, candidate keys, relationship tests, rent identity, and field classifications.
The ignored local DuckDB database is a reproducible working product, not a deployable artifact.

## Phase boundary

No raw source files were copied into the repository, no Supabase code or data was changed, and nothing was committed, pushed, deployed, or published.
