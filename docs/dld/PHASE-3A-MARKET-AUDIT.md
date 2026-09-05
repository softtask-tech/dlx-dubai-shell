# DLD Phase 3A market-data audit

Status: local review checkpoint only. No application code, database migration,
remote connection, upload, publication, commit, push or deployment is part of
this phase.

Source: `C:\Users\adams\Downloads\DLD DATA COD`, opened read-only through the
verified Phase 0 DuckDB. The snapshot contains 25 datasets, 62 files and
16,521,480 rows, with a latest source export date of 2026-09-04. Tracked
reports contain aggregate diagnostics and metadata only; they contain no raw
transaction, contract, participant or property records.

## Complete inventory

| Dataset | Kind | Rows | Files |
| --- | --- | ---: | ---: |
| Accredited Trainers by the Dubai Real Estate Institute | directory/snapshot | 117 | 2 |
| Approved Escrow Account Agents | directory/snapshot | 25 | 2 |
| Building and Property Project Records | property/registry snapshot | 256,423 | 2 |
| Developers Recorded in Dubai Land Department | directory/snapshot | 2,348 | 2 |
| Elders and People of Determination | directory/snapshot | 6,120 | 2 |
| Free Zone Companies Licensing | directory/snapshot | 250 | 2 |
| Land Registry | property/registry snapshot | 263,663 | 2 |
| Licenced Owner Associations | directory/snapshot | 110 | 2 |
| Licensed Real Estate Valuators | directory/snapshot | 153 | 2 |
| Lookup Dubai Community Areas | lookup | 301 | 2 |
| Lookup Real Estate Market Types | lookup | 2 | 2 |
| Lookup Real Estate Transactions Groups | lookup | 3 | 2 |
| Lookup Real Estate Transactions Procedures | lookup | 64 | 2 |
| Owners Association Service Charges | directory/snapshot | 91,193 | 2 |
| Property Map Requests | event | 1,021,252 | 2 |
| Property Valuation Records | event | 90,771 | 2 |
| Real Estate Brokers | directory/snapshot | 8,724 | 2 |
| Real Estate Licenses | directory/snapshot | 2,948 | 2 |
| Real Estate Offices | directory/snapshot | 4,963 | 2 |
| Real Estate Permits | directory/snapshot | 175,056 | 2 |
| Real Estate Projects | directory/snapshot | 3,039 | 2 |
| Real Estate Transactions | event | 1,776,143 | 3 |
| Registered Freehold Real Estate Units | property/registry snapshot | 2,374,726 | 4 |
| Rent Contracts | contract-line snapshot | 10,442,927 | 11 |
| Residential Sale Index | aggregate time-series snapshot | 159 | 2 |

All files are dated 2026-09-04 by export filename. Detailed relative paths,
formats, compressed/uncompressed sizes, encodings, Excel sheet metadata,
checksums, columns, types, nulls, identifiers, candidate keys and per-field
date coverage are in `reports/dld/phase3a/inventory.json`. The residential
index month key is corrected in Phase 3A to 2011-03-01 through 2024-05-01;
Phase 0's generic `month` parser did not recognize its ISO date representation.

## Transaction semantics and eligibility

One transaction row is one registered event identified uniquely by
`transaction_id`; all 1,776,143 IDs are unique. The raw parsed date range is
1416-07-02 through 2026-09-02. Four pre-1900 dates are invalid for market
series; period reports therefore begin at 1900 and the first observed valid
market period is 1966-01. September 2026 is partial through September 2.

The source transaction groups contain 1,360,071 Sales rows, 349,883 Mortgages
rows and 66,189 Gifts rows. Group membership alone is not a sale definition.
The Sales group includes lease-to-own, development registration and land
administration procedures. The conservative Phase 3A allowlist accepts only
procedure IDs 11 (Sell), 41 (Delayed Sell), 102 (Sell - Pre registration) and
460 (Sale On Payment Plan): 1,290,990 market-sale candidates. The remaining
69,081 Sales-group rows are excluded pending authoritative semantic review.
The complete bilingual policy and counts are in `procedure_policy.json`.

`actual_worth` has no missing, zero or negative values. `procedure_area` has no
missing, zero or negative values and its dictionary explicitly says square
metres. Recalculated value per square metre agrees with the supplied metre
price within 1% for 1,776,114 of 1,776,135 comparable rows. The dictionary does
not explicitly declare transaction currency, so sale-value and price metrics
remain conditional. Extreme values are retained privately and treated as
quality flags, not published market facts.

`reg_type` means Existing Properties versus Off-Plan Properties; it is not
primary versus secondary market. The separate two-row market-types lookup
cannot be joined to it. Developer is not present on a transaction and may be
inherited only through a unique matched project. The export supplies aggregate
party counts but no buyer or seller names. It supplies no reliable
cancellation/amendment state.

## Rental semantics

One rent row is one property line in an Ejari contract, uniquely identified by
`(contract_id, line_number)`. There are 10,442,927 lines and 8,713,621 distinct
contracts, with no duplicate composite keys. There are 246,313 multi-line
contracts containing 1,975,619 lines. Contract dates, registration type,
`contract_amount` and `annual_amount` are header facts repeated on every line;
they must never be summed over lines. Fifteen contracts span multiple areas
and 11 span multiple projects. Header fields are consistent across lines, but
5,594 contracts disagree with their declared property count.

The dictionary defines `contract_amount` as total contract value in AED and
`annual_amount` as the DLD-calculated annual value for a non-twelve-month
contract. There are 4,367,159 new and 4,346,462 renewed contracts. Parsed starts
run from 2001-02-15 to 2205-07-16 and ends from 2002-02-15 to 5013-05-28;
11,630 starts are after export, while many future end dates are expected for
active contracts. Six starts and 187 ends are in 2036 or later. There are 141
durations outside the conservative 1-to-3,660-day range. DLD annualization
reconciles within 2% for 8,357,334 of 8,713,480 comparable contracts.

Reliable counts and median annual rent are feasible at distinct-contract
grain. Geography-dependent values must use single-line/single-area contracts
unless an allocation method is approved. Rent per square foot is conditional
because the rent dictionary does not explicitly establish the `actual_area`
unit. Registration date, cancellation/status, stable unit identity and clean
numeric rooms are absent; renewals must not be linked speculatively.

## Relationships

| Relationship | Non-null match | Unmatched | Ambiguous rows | Decision |
| --- | ---: | ---: | ---: | --- |
| Transaction procedure ID alone | 100% | 0 | 71,154 | unsafe alone; six IDs occur in two groups |
| Transaction procedure + group | 100% | 0 | 0 | stable authoritative join |
| Procedure group to group lookup | 100% | 0 | 0 | stable |
| Transaction group to group lookup | 100% | 0 | 0 | stable |
| Transaction registration type to market type | 63.627309% | 646,031 | 0 | invalid; incompatible meanings |
| Transaction area to community | 100% | 0 | 0 | stable |
| Transaction project number to project | 97.123591% | 37,606 | 0 | partial; null for 468,749 |
| Rent area to community | 100% | 0 | 0 | stable; three null lines |
| Rent project number to project | 98.947720% | 16,968 | 0 | partial; null for 8,830,428 |
| Building project ID to project | 88.788103% | 16,699 | 0 | partial |
| Unit project ID to project | 85.033020% | 127,573 | 0 | partial |
| Land project ID to project | 92.125436% | 7,345 | 0 | partial |
| Project developer ID to developer | 99.736582% | 8 | 0 | partial; two null |
| Project master developer ID to developer | 100% | 0 | 0 | stable |

All joins use exact trimmed numeric normalization. Fuzzy name matching is never
authoritative. Property type/subtype, usage and contract-type labels carried on
facts may be aggregated as official labels, but a future model should create
versioned safe dimensions and fail on unresolved codes.

## Privacy and publication boundary

All 513 source fields are classified: 350 safe public dimensions, 70 safe only
after aggregation, 69 internal matching fields and 24 personal/sensitive
fields. Contact and demographic fields are prohibited. Transaction, contract,
participant, unit, property, land and other granular locator IDs stay private.
The tracked registry is designed for automated enforcement.

Public output may contain only approved dimensions, period labels, aggregate
facts, sample size, source export date, methodology version, suppression flag
and confidence flag. It must never expose raw transactions/contracts,
participant attributes, granular locators, internal joins or unsuppressed small
cells. English and Arabic official fields remain independent; no translation
or authoritative name join is generated. The bilingual audit found 1,046
English-only values, five Arabic-only values, 6,438 Arabic-script values in
English fields and 206,315 non-Arabic-script values in Arabic fields. These are
review flags, not automatic errors.

## Metric decisions

Supported after the stated eligibility and suppression rules: sale transaction
count, apartment/villa separation, existing/off-plan separation, rental
contract count, median annual rent and new/renewed rent. Conditionally
supported: sale value, median sale price, median price per square foot,
community/project trends, developer activity, period change and rent per square
foot. Transaction currency and rent-area units require confirmation before the
related conditional metrics can publish.

Primary/secondary market is unsupported. Gross rental yield is unsupported for
Phase 3B publication because the sale and rent populations cannot be aligned
to a stable shared unit or directly comparable cohort. It must never be called
investor return. Exact formulas, dimensions, deduplication and limitations are
in `metric_definitions.json`.

Every public metric requires at least 10 eligible observations. Cells of 10-29
are low confidence, 30-99 moderate and 100+ high, subject to quality flags.
Both periods in a comparison must pass; partial latest periods are excluded.
Invalid dates, non-positive denominators, non-eligible procedures, unresolved
links needed by the requested grain and flagged extreme values are excluded
according to the versioned methodology. Private facts retain legitimate
extremes for audit; public price distributions use robust medians, never silent
deletion or arbitrary averages.

## Rebuild, model and capacity proposal

Numbered chunks sharing an export date are one full snapshot. Future imports
must carry dataset/chunk order, byte size, SHA-256, row count, schema
fingerprint and export date. A repeated package hash and methodology is a
no-op. Compare stable keys and row hashes, replace each included snapshot, and
recompute affected periods plus dependent comparison windows. Schema or
semantic changes create a new methodology version. Staging validation and the
publication pointer switch occur in one transaction; failure preserves the
prior immutable run.

The proposed private model comprises source manifests/files, transaction
facts, rent contract headers, rent contract lines, quality results and
publication runs. Safe dimensions cover period, community, project, developer,
property type, procedure and market segment. Precomputed sale and rent periodic
aggregates feed public overview/community/project/developer series and search
functions. This is design only and has not been migrated.

Current source files total 8,020,066,755 bytes (about 7.47 GiB); the Phase 0
DuckDB is 993,275,904 bytes. The proposed typed private fact model is estimated
at 2,400,416,512 bytes uncompressed and 600,104,128-1,320,229,081 bytes
compressed. Approved public aggregates are estimated at 107,478 rows and
17,196,480 bytes. Phase 3B must measure real storage before capacity decisions.

## Proposed Phase 3B plan

1. Obtain owner/compliance confirmation for transaction currency, rent area
   units and the four-procedure sale allowlist.
2. Implement typed private facts and source-manifest staging locally, with
   schema-drift and complete-snapshot rejection.
3. Materialize versioned safe dimensions and exact relationships; quarantine,
   report and suppress unresolved required links.
4. Build deterministic periodic aggregates with thresholds, confidence and
   partial-period handling; keep yield and primary/secondary absent.
5. Add fixture/unit/integration tests, performance measurements and an atomic
   publication design. Prepare additive migrations only if separately approved.
6. Stop for another review before any remote access, upload or website work.

## Verification and owner decisions

Run `phase3a_audit.py` followed by `verify_phase3a.py`. The manifest hashes every
safe output, reconciles source/file/dataset counts, verifies transaction and
rent identities, locks the procedure policy, checks privacy invariants and
asserts that no raw-row payload keys exist. See `scripts/dld/README.md`.

Owner approval is required before Phase 3B for: transaction currency; rent area
unit; final sale-procedure eligibility; whether sale-value metrics should be
published at all; minimum-cell and confidence thresholds; treatment of extreme
but valid values; which geographic/project/developer grains are commercially
useful; and whether the DLD residential index should remain a separate official
series after its methodology is reviewed. No Phase 3B work starts automatically.
