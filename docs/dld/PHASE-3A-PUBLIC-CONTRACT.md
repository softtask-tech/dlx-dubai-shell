# Proposed Phase 3A public market-series contract

Status: design only, unapplied and unimplemented.

Every public row would contain only:

- `metric_key` and `methodology_version`
- `period_grain`, `period_start`, `is_complete_period`
- approved safe dimension keys/slugs and official English/Arabic labels
- `metric_value`, `sample_size`, `suppression_flag`, `confidence_flag`
- `source_export_date` and `published_at`

No endpoint or view may return source-row IDs, transaction/contract/property
facts, participant fields, internal relationship identifiers or values for a
cell whose sample is below the methodology threshold. Public functions must
query precomputed public aggregates, never private facts from the browser.

Candidate surfaces are Dubai overview, community time series, eligible project
time series, semantically limited developer activity, existing/off-plan,
apartment/villa, rental series and comparison pages. Project/developer rows are
omitted when exact relationship or sample validation fails. “Primary versus
secondary” and gross rental yield are absent, not estimated.

The transaction procedure allowlist, currency, rent-area unit, outlier policy,
suppression threshold and confidence labels are versioned methodology inputs.
Changing any input creates a new publication run and cannot silently rewrite a
previous series.
