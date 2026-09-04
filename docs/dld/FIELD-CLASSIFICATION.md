# DLD field publication classification

This is a product-exposure policy layered on top of the source dictionaries' `Open` label.

- **Public**: safe for direct labels, registry facts, dimensions, and already-aggregated statistics, with DLD attribution.
- **Aggregate-only**: usable for statistics after grouping and disclosure controls; do not expose source rows.
- **Internal**: join, lineage, contact, or granular locator fields retained only in controlled processing.

Current totals: public **362**, aggregate-only **72**, internal **79**.

The complete per-field decision and rationale is in `reports/dld/phase0/field_classification.csv`.
