#!/usr/bin/env python3
"""Independently verify the Phase 3C compact publication package."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import tempfile
import re
import zipfile
from collections import Counter
from datetime import date
from pathlib import Path

from phase3c_package import DEFAULT_DEVELOPER_REGISTRY, DEFAULT_OUTPUT, FIELDS, MAX_CHUNK_BYTES, METHODOLOGY_VERSION, PROHIBITED_TOKENS, REGISTRY_PATH, canonicalize_developer_number, package


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "data/dld/local/phase3b/phase3b.duckdb"
DEFAULT_BASELINE = ROOT / "data/dld/transfer/phase3c-corrective-baseline/dld-market-phase3c.zip"
ALLOWED_ENTITIES = {"dubai", "community", "project", "developer"}
ALLOWED_METRICS = {
    "registered_sale_count", "registered_sale_count_change",
    "registered_rental_contract_count", "registered_rental_contract_count_change",
    "registered_new_rental_contract_count", "registered_new_rental_contract_count_change",
    "registered_renewed_rental_contract_count", "registered_renewed_rental_contract_count_change",
    "median_registered_annual_rent_aed", "median_registered_annual_rent_change",
}


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def zip_records(path: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    with zipfile.ZipFile(path) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        for chunk in manifest["chunks"]:
            with archive.open(chunk["file"]) as raw:
                import io
                records.extend(csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline="")))
    return records


def compare_corrective_release(baseline_zip: Path, output_zip: Path) -> dict[str, int | bool]:
    old_rows, new_rows = zip_records(baseline_zip), zip_records(output_zip)
    old_other = Counter(tuple(sorted(row.items())) for row in old_rows if row["entity_type"] != "developer")
    new_other = Counter(tuple(sorted(row.items())) for row in new_rows if row["entity_type"] != "developer")

    def signature(row: dict[str, str], canonicalize: bool) -> tuple[tuple[str, str], ...]:
        value = dict(row)
        value.pop("aggregate_key")
        if canonicalize:
            value["entity_id"] = canonicalize_developer_number(value["entity_id"])
        return tuple(sorted(value.items()))

    old_developers = [row for row in old_rows if row["entity_type"] == "developer"]
    new_developers = [row for row in new_rows if row["entity_type"] == "developer"]
    originals_by_canonical: dict[str, set[str]] = {}
    for row in old_developers:
        originals_by_canonical.setdefault(canonicalize_developer_number(row["entity_id"]), set()).add(row["entity_id"])
    old_by_signature = {signature(row, True): row for row in old_developers}
    new_by_signature = {signature(row, False): row for row in new_developers}
    signatures_match = Counter(signature(row, True) for row in old_developers) == Counter(signature(row, False) for row in new_developers)
    shared = set(old_by_signature) & set(new_by_signature)
    return {
        "total_rows_unchanged": len(old_rows) == len(new_rows) == 108_982,
        "nondeveloper_rows_byte_identical": old_other == new_other,
        "developer_logical_fields_unchanged": signatures_match,
        "developer_rows": len(new_developers),
        "old_distinct_developer_ids": len({row["entity_id"] for row in old_developers}),
        "new_distinct_developer_ids": len({row["entity_id"] for row in new_developers}),
        "canonical_collision_groups": sum(len(values) > 1 for values in originals_by_canonical.values()),
        "developer_ids_changed": sum(old_by_signature[item]["entity_id"] != new_by_signature[item]["entity_id"] for item in shared),
        "developer_keys_changed": sum(old_by_signature[item]["aggregate_key"] != new_by_signature[item]["aggregate_key"] for item in shared),
    }


def verify(output: Path, database: Path = DEFAULT_DB, developer_registry: Path = DEFAULT_DEVELOPER_REGISTRY, baseline_zip: Path | None = None) -> dict:
    failures: list[str] = []
    checks = 0

    def check(value: bool, message: str) -> None:
        nonlocal checks
        checks += 1
        if not value:
            failures.append(message)

    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    registry = json.loads((output / "scope-registry.json").read_text(encoding="utf-8"))
    check(registry == json.loads(REGISTRY_PATH.read_text(encoding="utf-8")), "scope registry differs from tracked registry")
    check(manifest["scope_registry_sha256"] == digest(output / "scope-registry.json"), "scope registry hash mismatch")
    check(manifest["schema_version"] == "dld-market-transfer/1", "schema version mismatch")
    check(manifest["methodology_version"] == METHODOLOGY_VERSION, "methodology mismatch")
    keys: set[str] = set()
    counts: Counter[str] = Counter()
    rows = 0
    arabic = 0
    project_ids: set[str] = set()
    developer_ids: Counter[str] = Counter()
    for chunk in manifest["chunks"]:
        path = output / chunk["file"]
        check(path.is_file(), f"missing chunk {chunk['file']}")
        check(path.stat().st_size == chunk["bytes"] <= MAX_CHUNK_BYTES, f"chunk size mismatch {chunk['file']}")
        check(digest(path) == chunk["sha256"], f"chunk hash mismatch {chunk['file']}")
        chunk_rows = 0
        with path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            check(reader.fieldnames == FIELDS, f"schema mismatch {chunk['file']}")
            for record in reader:
                rows += 1
                chunk_rows += 1
                entity, grain, metric = record["entity_type"], record["period_grain"], record["metric_code"]
                counts[f"{entity}|{grain}|{metric}"] += 1
                check(entity in ALLOWED_ENTITIES, "invalid entity type")
                check(metric in ALLOWED_METRICS, "invalid metric")
                check(record["aggregate_key"] not in keys and len(record["aggregate_key"]) == 64, "duplicate or invalid aggregate key")
                keys.add(record["aggregate_key"])
                observations = int(record["observation_count"])
                check(observations >= 10, "suppressed cell present")
                if metric.endswith("_change") or metric == "median_registered_annual_rent_aed":
                    check(observations >= 30, "value/change cell below threshold")
                start = date.fromisoformat(record["period_start"])
                end = date.fromisoformat(record["period_end"])
                check(start >= date(2010, 1, 1), "pre-2010 row present")
                bounds = {"month": date(2026, 8, 31), "quarter": date(2026, 6, 30), "year": date(2025, 12, 31)}
                check(end <= bounds[grain], "incomplete period present")
                check(record["confidence"] in {"higher", "moderate", "counts_only"}, "invalid confidence")
                check(not PROHIBITED_TOKENS.intersection(record), "prohibited column present")
                check(not any(token in " ".join(record.values()).lower() for token in ("transaction_id", "contract_id", "residential sale index")), "prohibited content present")
                check(not (entity == "developer" and record["entity_id"].startswith("developer:")), "internal developer ID present")
                if entity == "project": project_ids.add(record["entity_id"])
                if entity == "developer":
                    developer_ids[record["entity_id"]] += 1
                    check(bool(re.fullmatch(r"[1-9][0-9]*", record["entity_id"])), "developer identifier is not canonical integer text")
                    check("." not in record["entity_id"] and not any(char.isspace() for char in record["entity_id"]), "developer identifier contains a decimal point or whitespace")
                    check(not record["entity_id"].startswith("d1_"), "developer identifier uses an internal hash")
                arabic += bool(record["name_ar"] and any("\u0600" <= char <= "\u06ff" for char in record["name_ar"]))
        check(chunk_rows == chunk["rows"], f"chunk row count mismatch {chunk['file']}")
    check(rows == manifest["total_expected_rows"], "total row count mismatch")
    check(dict(sorted(counts.items())) == manifest["expected_counts"], "expected count mismatch")
    check(rows < 150_000, "package exceeds approved target")
    check(arabic > 0, "Arabic text not preserved")
    import duckdb
    conn = duckdb.connect(str(database), read_only=True)
    known_projects = {str(row[0]) for row in conn.execute("select project_number from dim_projects where project_number is not null").fetchall()}
    directory_values = [str(row[0]) for row in conn.execute("select developer_number from read_parquet(?)", [str(developer_registry)]).fetchall()]
    directory_counts = Counter(directory_values)
    invalid_changes = conn.execute("""
      select count(*) from public_aggregates_sanitized p
      left join aggregate_cells_private prev on prev.data_domain=p.data_domain and prev.entity_type=p.entity_type
        and prev.entity_key=p.entity_key and prev.segment_type=p.segment_type and prev.segment_key=p.segment_key
        and prev.period_type=p.period_type and prev.period_start=p.period_start-case p.period_type
          when 'month' then interval '1 month' when 'quarter' then interval '3 months' else interval '1 year' end
      where p.metric_name like '%_period_change' and (prev.observation_count is null or prev.observation_count<30)
    """).fetchone()[0]
    conn.close()
    check(project_ids <= known_projects, "package contains an unmatched project identifier")
    check(all(directory_counts[value] == 1 for value in developer_ids), "developer identifier does not resolve exactly once in Phase 1A")
    check(len(developer_ids) == 727, "distinct developer identifier count changed")
    check(sum(developer_ids.values()) == 7_948, "developer aggregate row count changed")
    check(all("." not in value and value.strip() == value and value for value in developer_ids), "developer identifier formatting regression")
    check(manifest.get("developer_identity") == {"distinct_identifiers":727,"aggregate_rows":7948,"exact_directory_matches":727,"canonical_pattern":"^[1-9][0-9]*$"}, "developer identity manifest mismatch")
    check(invalid_changes == 0, "period change has an ineligible comparison period")
    allowed_files = {"manifest.json", "IMPORT-INSTRUCTIONS.md", "scope-registry.json", "dld-market-phase3c.zip", "dld-market-phase3c.zip.sha256"} | {item["file"] for item in manifest["chunks"]}
    check({path.name for path in output.iterdir()} == allowed_files, "unexpected file in transfer directory")
    with zipfile.ZipFile(output / "dld-market-phase3c.zip") as archive:
        check(set(archive.namelist()) == allowed_files - {"dld-market-phase3c.zip", "dld-market-phase3c.zip.sha256"}, "ZIP contents mismatch")
        check(all(not name.lower().endswith((".jsonl", ".xlsx", ".xls", ".duckdb", ".parquet", ".env")) for name in archive.namelist()), "raw/private file in ZIP")
    comparison = None
    if baseline_zip is not None:
        check(baseline_zip.is_file(), "corrective baseline ZIP missing")
        if baseline_zip.is_file():
            comparison = compare_corrective_release(baseline_zip, output / "dld-market-phase3c.zip")
            check(comparison["total_rows_unchanged"] and comparison["nondeveloper_rows_byte_identical"] and comparison["developer_logical_fields_unchanged"], "corrective logical comparison failed")
            check(comparison["developer_rows"] == comparison["developer_ids_changed"] == comparison["developer_keys_changed"] == 7_948, "not every developer ID/key changed")
            check(comparison["old_distinct_developer_ids"] == comparison["new_distinct_developer_ids"] == 727 and comparison["canonical_collision_groups"] == 0, "developer canonicalization collision detected")
    result = {"ok": not failures, "checks": checks, "rows": rows, "chunks": len(manifest["chunks"]), "developer_identity":{"distinct":len(developer_ids),"rows":sum(developer_ids.values()),"exact_matches":sum(directory_counts[value] == 1 for value in developer_ids)}, "corrective_comparison":comparison, "failures": failures}
    print(json.dumps(result, indent=2))
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--deterministic", action="store_true")
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    parser.add_argument("--developer-registry", type=Path, default=DEFAULT_DEVELOPER_REGISTRY)
    parser.add_argument("--baseline-zip", type=Path, default=DEFAULT_BASELINE)
    args = parser.parse_args()
    baseline = args.baseline_zip.resolve() if args.baseline_zip else None
    result = verify(args.output.resolve(), args.database.resolve(), args.developer_registry.resolve(), baseline)
    if result["ok"] and args.deterministic:
        expected = digest(args.output.resolve() / "dld-market-phase3c.zip")
        with tempfile.TemporaryDirectory(prefix="dld-phase3c-") as temp:
            other = Path(temp) / "package"
            package(args.database.resolve(), other, args.developer_registry.resolve())
            if digest(other / "dld-market-phase3c.zip") != expected:
                result["ok"] = False
                result["failures"].append("deterministic ZIP regeneration failed")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
