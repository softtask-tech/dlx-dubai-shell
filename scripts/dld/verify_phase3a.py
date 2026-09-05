#!/usr/bin/env python3
"""Verify Phase 3A aggregate reports without exposing source rows."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORTS = ROOT / "reports" / "dld" / "phase3a"
REQUIRED = {
    "inventory.json",
    "inventory.csv",
    "schema_fingerprints.json",
    "bilingual_quality.json",
    "bilingual_quality.csv",
    "transaction_profile.json",
    "transaction_periods.csv",
    "transaction_categories.csv",
    "procedure_policy.json",
    "procedure_policy.csv",
    "rent_profile.json",
    "rent_periods.csv",
    "rent_categories.csv",
    "residential_index_profile.json",
    "join_matrix.json",
    "join_matrix.csv",
    "privacy_registry.json",
    "privacy_registry.csv",
    "metric_definitions.json",
    "metric_definitions.csv",
    "quality_summary.json",
    "storage_estimates.json",
    "analytical_model.json",
    "update_architecture.json",
    "metadata.json",
    "manifest.json",
}
PROHIBITED_KEYS = {
    "transaction_id",
    "contract_id",
    "participant_id",
    "property_id",
    "unit_number",
    "phone",
    "email",
    "fax",
    "nationality",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return digest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reports", type=Path, default=DEFAULT_REPORTS)
    args = parser.parse_args()
    reports = args.reports.resolve()
    failures: list[str] = []
    present = {path.name for path in reports.iterdir() if path.is_file()}
    missing = REQUIRED - present
    if missing:
        failures.append(f"missing reports: {sorted(missing)}")

    metadata = json.loads((reports / "metadata.json").read_text(encoding="utf-8"))
    if metadata["dataset_count"] != 25:
        failures.append("dataset_count is not 25")
    if metadata["file_count"] != 62:
        failures.append("file_count is not 62")
    if metadata["source_row_count"] != 16_521_480:
        failures.append("source row reconciliation failed")
    if metadata["raw_rows_emitted"] != 0 or not metadata["database_opened_read_only"]:
        failures.append("privacy/read-only invariant failed")

    inventory = json.loads((reports / "inventory.json").read_text(encoding="utf-8"))
    if len(inventory) != 25 or sum(row["file_count"] for row in inventory) != 62:
        failures.append("inventory reconciliation failed")
    transaction = json.loads((reports / "transaction_profile.json").read_text(encoding="utf-8"))
    if transaction["total_rows"] != 1_776_143 or transaction["duplicate_transaction_ids"] != 0:
        failures.append("transaction identity failed")
    if transaction["market_sale_candidate_rows"] + transaction["non_standard_or_ambiguous_sales_group_rows"] != transaction["sale_rows"]:
        failures.append("sales-group procedure policy does not reconcile")
    procedures = json.loads((reports / "procedure_policy.json").read_text(encoding="utf-8"))
    if len(procedures) != 64 or any(row["group_id"] == 1 and row["eligible_for_sale_market_metrics"] != (row["procedure_id"] in {11, 41, 102, 460}) for row in procedures):
        failures.append("procedure policy allowlist drifted")
    rent = json.loads((reports / "rent_profile.json").read_text(encoding="utf-8"))
    if rent["total_property_lines"] != 10_442_927 or rent["distinct_contracts"] != 8_713_621:
        failures.append("rent count reconciliation failed")
    if rent["duplicate_contract_line_keys"] != 0:
        failures.append("rent composite key is not unique")
    index = json.loads((reports / "residential_index_profile.json").read_text(encoding="utf-8"))
    if index["total_rows"] != 159 or index["distinct_period_keys"] != 159 or index["invalid_period_keys"] != 0:
        failures.append("residential index period identity failed")

    metrics = json.loads((reports / "metric_definitions.json").read_text(encoding="utf-8"))
    if len(metrics) != 16:
        failures.append("expected 16 metric decisions")
    if next(row for row in metrics if row["metric"] == "gross_rental_yield")["confidence"] != "unsupported for Phase 3B publication":
        failures.append("yield publication boundary weakened")

    privacy = json.loads((reports / "privacy_registry.json").read_text(encoding="utf-8"))
    for key in PROHIBITED_KEYS:
        decisions = [row for row in privacy if row["field"] == key]
        if decisions and any(row["publication"] not in {"prohibited", "aggregate-only", "internal"} for row in decisions):
            failures.append(f"prohibited field classified public: {key}")

    manifest = json.loads((reports / "manifest.json").read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        path = reports / entry["file"]
        if not path.is_file() or path.stat().st_size != entry["bytes"] or sha256_file(path) != entry["sha256"]:
            failures.append(f"manifest mismatch: {entry['file']}")

    # Aggregate outputs may mention prohibited field names as policy/schema, but
    # must never carry raw row objects. No report schema has a `sample` payload.
    for path in reports.glob("*.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and any(key in payload for key in {"sample_rows", "raw_rows", "records"}):
            failures.append(f"raw/sample payload key in {path.name}")

    result = {"ok": not failures, "checks": 16, "failures": failures}
    (reports / "verification.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
