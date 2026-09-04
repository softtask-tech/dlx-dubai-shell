# DLD Phase 1A completion summary

Phase 1A is complete locally and stopped at the review boundary. Nothing was uploaded, applied, committed, pushed, deployed, or connected to Supabase.

## Output counts

| Output | Rows |
|---|---:|
| Communities | 301 |
| Developers | 2,348 |
| Projects | 3,039 |
| Brokers (unique official broker IDs) | 8,709 |
| Broker–office links | 8,724 |
| Offices (unique official office IDs) | 2,574 |
| Office activities | 4,963 |
| Licences | 2,948 |
| Permits | 175,056 |
| Valuators | 153 |
| Escrow agents | 25 |
| Owner associations | 110 |
| Free-zone companies | 250 |
| Universal search index | 195,513 |

All canonical and relationship keys are unique. Fifteen brokers have two office affiliations and are therefore normalized into broker records plus link rows. A deterministic internal activity key preserves 170 office-activity rows whose official activity-type ID is null.

## Relationship coverage

| Relationship | Non-null rows | Matched | Row coverage | Orphan rows / keys |
|---|---:|---:|---:|---:|
| Project → developer | 3,037 | 3,029 | 99.736582% | 8 / 4 |
| Project → community | 3,039 | 3,039 | 100% | 0 / 0 |
| Project → escrow agent | 2,879 | 2,718 | 94.407780% | 161 / 19 |
| Broker affiliation → office | 8,724 | 8,711 | 99.850986% | 13 / 3 |
| Office participant → licence participant | 2,574 | 372 | 14.452214% | 2,202 / 2,202 |
| Developer participant → licence participant | 2,348 | 78 | 3.321976% | 2,270 / 2,270 |

Orphan source identifiers are retained internally; their matched foreign-key columns are null. No fuzzy or name-based relationship was invented.

## Validation

- Phase 1A builder: pass.
- Deterministic byte-for-byte rewrite: pass.
- English and Arabic developer/broker search: pass.
- Community-name, project-number, licence-number, and permit-number search: pass.
- Eleven expected search entity types: pass.
- Forbidden public-field scan: pass.
- All nullable matched foreign keys resolve: pass.
- Network-free importer dry run: pass.
- Phase 0 integrity, including source size/hash checks: pass (160 checks).

See the machine-readable reports in `reports/dld/phase1a` for exact schemas, hashes, probes, and relationship details.

## Privacy result

Professional verification names, official numbers, activities/statuses, validity dates, relationships, and provenance are public candidates. Phone, email, fax, webpage, participant IDs, normalized aliases, and matching-only IDs remain internal or are excluded. No Phase 1A directory field is classified aggregate-only because the directory contains no analytical measure; future metrics remain out of scope. Licence source keys exposed through search are opaque hashes, not participant-ID composites.
