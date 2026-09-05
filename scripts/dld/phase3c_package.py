#!/usr/bin/env python3
"""Generate the deterministic, sanitized Phase 3C market transfer package."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import shutil
import zipfile
from collections import Counter
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable

import duckdb


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "data/dld/local/phase3b/phase3b.duckdb"
DEFAULT_OUTPUT = ROOT / "data/dld/transfer/phase3c"
DEFAULT_DEVELOPER_REGISTRY = ROOT / "data/dld/directory/phase1a/developers.parquet"
REGISTRY_PATH = Path(__file__).with_name("phase3c_scope_registry.json")
SCHEMA_VERSION = "dld-market-transfer/1"
METHODOLOGY_VERSION = "dld-market-publication-phase3c-v1"
MAX_CHUNK_BYTES = 4 * 1024 * 1024
FIELDS = [
    "aggregate_key", "entity_type", "entity_id", "name_en", "name_ar",
    "period_grain", "period_start", "period_end", "metric_code",
    "segment_type", "segment_code", "metric_value", "observation_count",
    "confidence", "quality_flags", "source_export_date", "methodology_version",
]
PROHIBITED_TOKENS = {
    "transaction_id", "contract_id", "property_id", "unit_number", "land_number",
    "participant_id", "phone", "email", "fax", "nationality", "developer_id",
    "recorded_value", "annual_amount", "actual_area", "rsi",
}
DEVELOPER_NUMBER_PATTERN = re.compile(r"^[0-9]+(?:\.0+)?$")


def observation_is_publishable(metric_code: str, observations: int) -> bool:
    """Apply the public count/value/change threshold without revealing a small cell."""
    threshold = 30 if metric_code.endswith("_change") or metric_code == "median_registered_annual_rent_aed" else 10
    return observations >= threshold


def canonicalize_developer_number(value: Any) -> str:
    """Return an official developer number as positive base-10 integer text.

    Outer whitespace is controlled by trimming. Embedded whitespace, signs,
    punctuation other than a zero-only decimal part, and scientific notation are
    rejected. Decimal parses are exact; binary floating-point rounding is never
    used to decide integrality.
    """
    if value is None or isinstance(value, bool):
        raise ValueError("developer number must be a numeric identifier")
    text = str(value).strip()
    if not text or not DEVELOPER_NUMBER_PATTERN.fullmatch(text):
        raise ValueError(f"invalid developer number representation: {text!r}")
    try:
        number = Decimal(text)
    except InvalidOperation as error:
        raise ValueError("invalid developer number") from error
    if not number.is_finite() or number <= 0 or number != number.to_integral_value():
        raise ValueError("developer number must be finite, positive, and integral")
    return str(int(number))


def build_developer_number_map(rows: Iterable[tuple[Any, Any]]) -> dict[int, str]:
    """Build a collision-free internal-to-public lookup from authoritative values."""
    result: dict[int, str] = {}
    owners: dict[str, int] = {}
    for internal_value, official_value in rows:
        internal_id = int(internal_value)
        canonical = canonicalize_developer_number(official_value)
        if internal_id in result and result[internal_id] != canonical:
            raise ValueError(f"developer {internal_id} has conflicting official numbers")
        if canonical in owners and owners[canonical] != internal_id:
            raise ValueError(f"developer-number canonicalization collision: {canonical}")
        result[internal_id] = canonical
        owners[canonical] = internal_id
    return result


def canonical_json(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def registry_predicate(registry: dict[str, Any]) -> str:
    clauses: list[str] = []
    for rule in registry["rules"]:
        entity = ",".join(map(quote, rule["entity_types"]))
        periods = ",".join(map(quote, rule["period_grains"]))
        metrics = ",".join(map(quote, rule["source_metrics"]))
        segment_clauses = []
        for segment_type, keys in rule["segments"].items():
            segment_clauses.append(
                f"(segment_type={quote(segment_type)} and segment_key in ({','.join(map(quote, keys))}))"
            )
        clauses.append(
            f"(entity_type in ({entity}) and period_type in ({periods}) "
            f"and metric_name in ({metrics}) and ({' or '.join(segment_clauses)}))"
        )
    return " or ".join(clauses)


def public_metric(data_domain: str, metric: str, segment_type: str, segment_key: str) -> str:
    if metric == "sales_count":
        return "registered_sale_count"
    if metric == "sales_count_period_change":
        return "registered_sale_count_change"
    if metric == "rent_count":
        if segment_type == "registration_type":
            return "registered_new_rental_contract_count" if segment_key == "registration:1" else "registered_renewed_rental_contract_count"
        return "registered_rental_contract_count"
    if metric == "rent_count_period_change":
        if segment_type == "registration_type":
            return "registered_new_rental_contract_count_change" if segment_key == "registration:1" else "registered_renewed_rental_contract_count_change"
        return "registered_rental_contract_count_change"
    if metric == "rent_annual_amount_median":
        return "median_registered_annual_rent_aed"
    if metric == "rent_annual_amount_median_period_change":
        return "median_registered_annual_rent_change"
    raise ValueError(f"unsupported metric: {data_domain}/{metric}")


def public_segment(data_domain: str, segment_type: str, segment_key: str) -> tuple[str, str]:
    if segment_type == "all":
        return "all", "all"
    if segment_type == "property_class":
        return "property_class", {"property_subtype:4": "villa", "property_subtype:60": "apartment"}[segment_key]
    if segment_type == "registration_type":
        if data_domain == "sales":
            return "sale_registration", {"registration:0": "off_plan", "registration:1": "existing"}[segment_key]
        return "rental_registration", {"registration:1": "new", "registration:2": "renewed"}[segment_key]
    raise ValueError(f"unsupported segment: {segment_type}/{segment_key}")


def aggregate_key(record: dict[str, Any]) -> str:
    identity = "\x1f".join(str(record[key]) for key in (
        "entity_type", "entity_id", "period_grain", "period_start", "period_end",
        "metric_code", "segment_type", "segment_code", "methodology_version",
    ))
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def transform(row: tuple[Any, ...], developer_numbers: dict[int, str]) -> dict[str, Any]:
    (domain, entity_type, entity_key, name_en, name_ar, segment_type, segment_key,
     period_grain, period_start, period_end, metric, value, observations, confidence,
     quality_flags, source_date) = row
    if entity_type == "developer":
        internal_id = int(entity_key.split(":", 1)[1])
        entity_id = developer_numbers.get(internal_id)
        if not entity_id:
            raise ValueError(f"developer has no safe public number: {internal_id}")
    elif entity_type in {"project", "community"}:
        entity_id = entity_key.split(":", 1)[1]
    else:
        entity_id = "dubai"
    public_segment_type, segment_code = public_segment(domain, segment_type, segment_key)
    record = {
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "name_en": name_en or "",
        "name_ar": name_ar or "",
        "period_grain": period_grain,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "metric_code": public_metric(domain, metric, segment_type, segment_key),
        "segment_type": public_segment_type,
        "segment_code": segment_code,
        "metric_value": format(float(value), ".15g"),
        "observation_count": int(observations),
        "confidence": confidence,
        "quality_flags": quality_flags,
        "source_export_date": source_date.isoformat(),
        "methodology_version": METHODOLOGY_VERSION,
    }
    if not observation_is_publishable(record["metric_code"], record["observation_count"]):
        raise ValueError("source row does not meet the Phase 3C publication threshold")
    record["aggregate_key"] = aggregate_key(record)
    return {field: record[field] for field in FIELDS}


def csv_line(values: dict[str, Any], header: bool = False) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=FIELDS, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    if header:
        writer.writeheader()
    else:
        writer.writerow(values)
    return stream.getvalue().encode("utf-8")


def write_chunks(output: Path, records: Iterable[dict[str, Any]]) -> tuple[list[dict[str, Any]], Counter[str]]:
    header = csv_line({}, header=True)
    pending: list[tuple[Path, int]] = []
    counts: Counter[str] = Counter()
    handle = None
    size = rows = index = 0
    try:
        for record in records:
            line = csv_line(record)
            if len(header) + len(line) > MAX_CHUNK_BYTES:
                raise ValueError("a single CSV row exceeds the chunk limit")
            if handle is None or (rows and size + len(line) > MAX_CHUNK_BYTES):
                if handle is not None:
                    handle.close()
                    pending.append((path, rows))
                index += 1
                path = output / f"market-{index:04d}.csv"
                handle = path.open("wb")
                handle.write(header)
                size, rows = len(header), 0
            handle.write(line)
            size += len(line)
            rows += 1
            counts[f"{record['entity_type']}|{record['period_grain']}|{record['metric_code']}"] += 1
    finally:
        if handle is not None:
            handle.close()
            pending.append((path, rows))
    total = len(pending)
    chunks = []
    for index, (old_path, row_count) in enumerate(pending, 1):
        new_path = output / f"market-{index:04d}-of-{total:04d}.csv"
        old_path.rename(new_path)
        chunks.append({"file": new_path.name, "rows": row_count, "bytes": new_path.stat().st_size, "sha256": sha256_file(new_path)})
    return chunks, counts


def package(database: Path, output: Path, developer_registry: Path = DEFAULT_DEVELOPER_REGISTRY) -> dict[str, Any]:
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    conn = duckdb.connect(str(database), read_only=True)
    predicate = registry_predicate(registry)
    developer_numbers = build_developer_number_map(conn.execute("select developer_id, developer_number from dim_developers").fetchall())
    directory_rows = conn.execute("select developer_number from read_parquet(?)", [str(developer_registry)]).fetchall()
    directory_numbers = [canonicalize_developer_number(row[0]) for row in directory_rows]
    if len(directory_numbers) != len(set(directory_numbers)):
        raise ValueError("Phase 1A developer-number registry is not unique after canonicalization")
    referenced_internal_ids = {
        int(row[0]) for row in conn.execute(
            f"select distinct try_cast(split_part(entity_key,':',2) as bigint) from public_aggregates_sanitized "
            f"where entity_type='developer' and completeness_state='complete' and suppression_state='publishable' "
            f"and period_start >= date '2010-01-01' and ({predicate})"
        ).fetchall()
    }
    referenced_numbers = {developer_numbers[item] for item in referenced_internal_ids}
    if not referenced_numbers <= set(directory_numbers):
        raise ValueError("developer aggregate does not exactly match the Phase 1A public developer-number registry")
    query = f"""
      select data_domain,entity_type,entity_key,entity_name_en,entity_name_ar,
        segment_type,segment_key,period_type,period_start,period_end,metric_name,
        metric_value,observation_count,confidence_state,quality_flags,source_export_date
      from public_aggregates_sanitized
      where completeness_state='complete' and suppression_state='publishable'
        and period_start >= date '2010-01-01' and ({predicate})
      order by entity_type,entity_key,period_type,period_start,metric_name,segment_type,segment_key
    """
    cursor = conn.execute(query)

    def records() -> Iterable[dict[str, Any]]:
        while batch := cursor.fetchmany(10_000):
            for row in batch:
                yield transform(row, developer_numbers)

    chunks, counts = write_chunks(output, records())
    original_rows = conn.execute("select count(*) from public_aggregates_sanitized").fetchone()[0]
    source_date = conn.execute("select max(source_export_date) from public_aggregates_sanitized").fetchone()[0]
    conn.close()
    registry_bytes = canonical_json(registry)
    (output / "scope-registry.json").write_bytes(registry_bytes)
    instructions = f"""# Phase 3C market aggregate import

This package contains sanitized aggregates only. It contains no transaction-, contract-, property-, unit-, land- or participant-level rows.

1. Verify the ZIP sidecar SHA-256, then every chunk hash and byte size in `manifest.json`.
2. Apply `20260906010000_dld_market_compact_publication.sql` in Lovable Cloud only after review.
3. Create one import run using the manifest metadata and package hash. Do not expose its identifier publicly.
4. Upload chunks in manifest order to the private staging table. A retry is safe because `(import_run_id, aggregate_key)` is unique.
5. Call the service-role-only validation function. Resolve every error; warnings do not bypass errors.
6. Call the service-role-only publish function. Validation, canonical insertion and active-run switch occur atomically.
7. Confirm public metadata reports {source_date.isoformat()}, {METHODOLOGY_VERSION}, and {sum(item['rows'] for item in chunks):,} rows.
8. Test the bounded overview, series, comparison and entity lookup RPCs as anon. Confirm direct tables remain inaccessible.

Rollback: do not activate a failed run. To restore an earlier successful run, use the service-role-only activation function with that published run after verifying it. Never edit canonical rows in place.
"""
    (output / "IMPORT-INSTRUCTIONS.md").write_text(instructions, encoding="utf-8", newline="\n")
    total_rows = sum(item["rows"] for item in chunks)
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "methodology_version": METHODOLOGY_VERSION,
        "source_methodology_version": "dld-market-aggregation-phase3b-v1",
        "source_export_date": source_date.isoformat(),
        "package_created_at": datetime.combine(source_date, datetime.min.time(), tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        "publication_floor": registry["publication_floor"],
        "scope_registry_sha256": sha256_bytes(registry_bytes),
        "original_phase3b_rows": int(original_rows),
        "total_expected_rows": total_rows,
        "expected_counts": dict(sorted(counts.items())),
        "developer_identity": {
            "distinct_identifiers": len(referenced_numbers),
            "aggregate_rows": sum(value for key, value in counts.items() if key.startswith("developer|")),
            "exact_directory_matches": len(referenced_numbers),
            "canonical_pattern": "^[1-9][0-9]*$",
        },
        "chunks": chunks,
    }
    (output / "manifest.json").write_bytes(canonical_json(manifest))
    zip_path = output / "dld-market-phase3c.zip"
    members = [output / "manifest.json", output / "IMPORT-INSTRUCTIONS.md", output / "scope-registry.json"] + [output / item["file"] for item in chunks]
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in members:
            info = zipfile.ZipInfo(path.name, (2026, 9, 4, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    zip_hash = sha256_file(zip_path)
    (output / "dld-market-phase3c.zip.sha256").write_text(f"{zip_hash}  {zip_path.name}\n", encoding="ascii", newline="\n")
    result = {"rows": total_rows, "chunks": len(chunks), "zip": str(zip_path), "zip_bytes": zip_path.stat().st_size, "zip_sha256": zip_hash, "counts": dict(sorted(counts.items()))}
    print(json.dumps(result, indent=2, sort_keys=True))
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--developer-registry", type=Path, default=DEFAULT_DEVELOPER_REGISTRY)
    args = parser.parse_args()
    package(args.database.resolve(), args.output.resolve(), args.developer_registry.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
