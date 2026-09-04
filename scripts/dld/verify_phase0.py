#!/usr/bin/env python3
"""Verify completeness and internal consistency of generated DLD Phase 0 reports."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path


REQUIRED = {
    "audit_metadata.json", "inventory.json", "inventory.csv",
    "attribute_dictionary.json", "attribute_dictionary.csv",
    "datasets.json", "datasets.csv", "columns.json", "columns.csv",
    "candidate_keys.json", "candidate_keys.csv", "date_ranges.json", "date_ranges.csv",
    "relationships.json", "relationships.csv", "rent_identity.json",
    "field_classification.json", "field_classification.csv", "report_manifest.json",
}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(8 * 1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def fail(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reports", type=Path, default=Path("reports/dld/phase0"))
    parser.add_argument("--source", type=Path, help="Optionally re-check source sizes and SHA-256 hashes")
    args = parser.parse_args()
    report_dir = args.reports
    failures: list[str] = []

    present = {path.name for path in report_dir.iterdir() if path.is_file()} if report_dir.exists() else set()
    fail(REQUIRED <= present, f"Missing reports: {sorted(REQUIRED - present)}", failures)
    if failures:
        print("\n".join(f"FAIL: {message}" for message in failures))
        return 1

    metadata = read_json(report_dir / "audit_metadata.json")
    inventory = read_json(report_dir / "inventory.json")
    dictionaries = read_json(report_dir / "attribute_dictionary.json")
    datasets = read_json(report_dir / "datasets.json")
    columns = read_json(report_dir / "columns.json")
    candidates = read_json(report_dir / "candidate_keys.json")
    relationships = read_json(report_dir / "relationships.json")
    rent = read_json(report_dir / "rent_identity.json")
    classifications = read_json(report_dir / "field_classification.json")
    manifest = read_json(report_dir / "report_manifest.json")

    fail(len(inventory) == 62, "Inventory must contain 62 files", failures)
    fail(sum(row["extension"] == ".csv" for row in inventory) == 37, "Inventory must contain 37 CSV files", failures)
    fail(sum(row["extension"] == ".xlsx" for row in inventory) == 25, "Inventory must contain 25 XLSX files", failures)
    fail(len({row["workbook"] for row in dictionaries}) == 25, "All 25 dictionaries must be represented", failures)
    fail(len(datasets) == 25, "Dataset profile must contain 25 datasets", failures)
    fail(sum(row["source_csv_files"] for row in datasets) == 37, "Dataset chunk counts must sum to 37", failures)
    fail(sum(row["row_count"] for row in datasets) == metadata["total_rows"], "Total row count mismatch", failures)
    fail(len(columns) == sum(row["column_count"] for row in datasets), "Column profile count mismatch", failures)
    fail(len(classifications) == len(columns), "Every source field must be classified", failures)
    fail({row["classification"] for row in classifications} <= {"public", "aggregate-only", "internal"}, "Unknown classification", failures)
    fail(len(relationships) == 22, "All 22 relationships must be tested", failures)
    fail(any(row["is_candidate_key"] for row in candidates), "No candidate keys were found", failures)
    fail(rent["rent_property_row_identity"] == ["contract_id", "line_number"], "Rent row identity is incorrect", failures)
    fail(rent["contract_identity"] == ["contract_id"], "Rent contract identity is incorrect", failures)
    fail(metadata["supabase_writes"] == 0, "Supabase writes must remain zero", failures)
    fail(metadata["raw_rows_in_reports"] == 0, "Reports must contain no raw rows", failures)
    fail(metadata["source_unchanged_during_run"] is True, "Source immutability check failed", failures)

    for item in manifest:
        path = report_dir / item["file"]
        fail(path.exists(), f"Manifest file missing: {item['file']}", failures)
        if path.exists():
            fail(path.stat().st_size == item["bytes"], f"Size mismatch: {item['file']}", failures)
            fail(sha256_file(path) == item["sha256"], f"Checksum mismatch: {item['file']}", failures)

    if args.source:
        source = args.source.resolve()
        for item in inventory:
            path = source / Path(item["relative_path"])
            fail(path.is_file(), f"Source file missing: {item['relative_path']}", failures)
            if path.is_file():
                fail(path.stat().st_size == item["bytes"], f"Source size changed: {item['relative_path']}", failures)
                fail(sha256_file(path) == item["sha256"], f"Source hash changed: {item['relative_path']}", failures)

    verification = {
        "status": "pass" if not failures else "fail",
        "checks": 18 + len(manifest) + (len(inventory) * 2 if args.source else 0),
        "failures": failures,
    }
    (report_dir / "verification.json").write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if failures:
        print("\n".join(f"FAIL: {message}" for message in failures))
        return 1
    print(f"PASS: Phase 0 reports verified ({verification['checks']} checks).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
