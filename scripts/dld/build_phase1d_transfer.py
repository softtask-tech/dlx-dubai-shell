#!/usr/bin/env python3
"""Build the deterministic sanitized Phase 1D JSONL transfer package."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Iterable

import duckdb

from phase1d_contract import (
    ENTITY_ORDER, EXPECTED_COUNTS, MAX_CHUNK_BYTES, METHODOLOGY_VERSION,
    SAFE_FIELDS, SCHEMA_VERSION, json_value, source_key, validate_envelope,
)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "data/dld/directory/phase1a"
DEFAULT_OUTPUT = ROOT / "data/dld/transfer/phase1d"
ZIP_NAME = "dld-directory-phase1d.zip"
INSTRUCTIONS = ROOT / "docs/dld/PHASE-1D-IMPORT-INSTRUCTIONS.md"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def select_sql(entity: str) -> tuple[str, str]:
    # The first expression is an internal-only seed that is irreversibly hashed.
    base = {
        "communities": ("area_id", "p.*"),
        "developers": ("developer_id", "p.*"),
        "escrow_agents": ("escrow_agent_number", "p.*"),
        "offices": ("office_id", "p.*"),
        "brokers": ("broker_id", "p.*"),
        "permits": ("permit_id", "p.*"),
        "valuators": ("valuator_key", "p.*"),
        "owner_associations": ("association_key", "p.*"),
        "free_zone_companies": ("company_number", "p.*"),
    }
    if entity in base:
        return base[entity]
    if entity == "projects":
        return "p.project_id", """p.project_number,p.source_name,p.name_en,p.name_ar,
          case when p.developer_id is not null then p.developer_number end developer_number,
          case when p.developer_id is not null then 'matched' when p.source_developer_id is not null or p.developer_number is not null or p.source_developer_name is not null then 'unmatched' else 'none' end developer_relationship_state,
          md.developer_number master_developer_number,
          c.municipality_number community_municipality_number,c.name_en community_name_en,c.name_ar community_name_ar,
          'matched' community_relationship_state,
          p.escrow_agent_number,
          case when p.escrow_agent_number is not null then 'matched' when p.source_escrow_agent_number is not null then 'unmatched' else 'none' end escrow_relationship_state,
          p.area_name_en,p.area_name_ar,p.status_en,p.status_ar,p.percent_completed,p.project_start_date,p.project_end_date,
          p.completion_date,p.cancellation_date,p.no_of_units,p.no_of_villas,p.no_of_buildings,p.source_export_date,p.source_dataset"""
    if entity == "office_activities":
        return "p.activity_key", "p.activity_type_id,p.activity_name_en,p.activity_name_ar,p.ded_activity_code,p.source_export_date,p.source_dataset,o.office_number"
    if entity == "broker_office_links":
        return "p.broker_id || chr(31) || p.source_office_id", """b.broker_number,
          case when p.office_id is not null then p.office_number end office_number,
          case when p.office_id is not null then 'matched' else 'unmatched' end office_relationship_state,
          p.licence_start_date,p.licence_end_date,p.source_export_date,p.source_dataset"""
    if entity == "licences":
        return "p.licence_key", """p.activity_type_id,p.activity_name_en,p.activity_name_ar,p.licence_number,p.trade_name_en,p.trade_name_ar,
          p.status_en,p.status_ar,p.issue_date,p.expiry_date,p.cancel_date,p.legal_type_en,p.legal_type_ar,p.ded_activity_code,p.authority_id,
          o.office_number,case when p.matched_office_id is null then 'none' else 'matched' end office_relationship_state,
          d.developer_number,case when p.matched_developer_id is null then 'none' else 'matched' end developer_relationship_state,
          p.source_export_date,p.source_dataset"""
    raise KeyError(entity)


def query(entity: str, input_dir: Path) -> tuple[duckdb.DuckDBPyConnection, Any]:
    conn = duckdb.connect()
    path = (input_dir / f"{entity}.parquet").as_posix()
    seed, columns = select_sql(entity)
    joins = ""
    if entity == "projects":
        joins = f"""left join read_parquet('{(input_dir/'developers.parquet').as_posix()}') md on md.developer_id=p.master_developer_id
          left join read_parquet('{(input_dir/'communities.parquet').as_posix()}') c on c.area_id=p.area_id"""
    elif entity == "office_activities":
        joins = f"left join read_parquet('{(input_dir/'offices.parquet').as_posix()}') o on o.office_id=p.office_id"
    elif entity == "broker_office_links":
        joins = f"left join read_parquet('{(input_dir/'brokers.parquet').as_posix()}') b on b.broker_id=p.broker_id"
    elif entity == "licences":
        joins = f"""left join read_parquet('{(input_dir/'offices.parquet').as_posix()}') o on o.office_id=p.matched_office_id
          left join read_parquet('{(input_dir/'developers.parquet').as_posix()}') d on d.developer_id=p.matched_developer_id"""
    if columns == "p.*":
        columns = ",".join(f"p.{field}" for field in SAFE_FIELDS[entity])
    sql = f"select {seed} _seed,{columns} from read_parquet('{path}') p {joins} order by 1"
    return conn, conn.execute(sql)


def records(entity: str, input_dir: Path) -> Iterable[dict[str, Any]]:
    conn, cursor = query(entity, input_dir)
    names = [column[0] for column in cursor.description][1:]
    try:
        while rows := cursor.fetchmany(2000):
            for row in rows:
                payload = {name: json_value(value) for name, value in zip(names, row[1:])}
                # Exact shape and order are contract-controlled, not inherited from Parquet.
                payload = {field: payload.get(field) for field in SAFE_FIELDS[entity]}
                record = {"entity_type": entity, "source_key": source_key(entity, row[0]), "payload": payload}
                errors = validate_envelope(record)
                if errors:
                    raise ValueError(f"{entity}/{record['source_key']}: {'; '.join(errors)}")
                yield record
    finally:
        conn.close()


def encoded(record: dict[str, Any]) -> bytes:
    return (json.dumps(record, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n").encode("utf-8")


def write_chunks(entity: str, input_dir: Path, work_dir: Path) -> list[dict[str, Any]]:
    temporary: list[tuple[Path, int]] = []
    handle = None
    size = count = 0
    try:
        for record in records(entity, input_dir):
            line = encoded(record)
            if len(line) > MAX_CHUNK_BYTES:
                raise ValueError(f"single {entity} row exceeds maximum chunk size")
            if handle is None or (size and size + len(line) > MAX_CHUNK_BYTES):
                if handle is not None:
                    handle.close()
                    temporary.append((Path(handle.name), count))
                handle = tempfile.NamedTemporaryFile("wb", delete=False, dir=work_dir, prefix=f".{entity}-")
                size = count = 0
            handle.write(line)
            size += len(line)
            count += 1
        if handle is not None:
            handle.close()
            temporary.append((Path(handle.name), count))
    finally:
        if handle is not None and not handle.closed:
            handle.close()
    chunks: list[dict[str, Any]] = []
    total = len(temporary)
    for index, (temp_path, row_count) in enumerate(temporary, 1):
        filename = f"{entity}-{index:04d}-of-{total:04d}.jsonl"
        path = work_dir / filename
        temp_path.replace(path)
        chunks.append({"filename": filename, "row_count": row_count, "bytes": path.stat().st_size, "sha256": sha256(path)})
    return chunks


def deterministic_zip(package_dir: Path, zip_path: Path, filenames: list[str]) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for filename in filenames:
            info = zipfile.ZipInfo(filename, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (package_dir / filename).read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def build(input_dir: Path, output_dir: Path, created_at: str) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    work_dir = Path(tempfile.mkdtemp(prefix="phase1d-", dir=output_dir.parent))
    try:
        entities = []
        chunk_names: list[str] = []
        for entity in ENTITY_ORDER:
            chunks = write_chunks(entity, input_dir, work_dir)
            count = sum(item["row_count"] for item in chunks)
            if count != EXPECTED_COUNTS[entity]:
                raise ValueError(f"{entity}: expected {EXPECTED_COUNTS[entity]}, got {count}")
            source_dates = sorted({json.loads(line)["payload"]["source_export_date"] for chunk in chunks for line in (work_dir/chunk["filename"]).read_text(encoding="utf-8").splitlines()})
            entities.append({"entity_type": entity, "source_export_date": source_dates[0] if len(source_dates) == 1 else source_dates, "chunks": chunks, "total_row_count": count, "total_bytes": sum(item["bytes"] for item in chunks)})
            chunk_names.extend(item["filename"] for item in chunks)
        manifest = {"schema_version": SCHEMA_VERSION, "methodology_version": METHODOLOGY_VERSION, "package_created_at": created_at, "upload_order": list(ENTITY_ORDER), "expected_counts": {entity: EXPECTED_COUNTS[entity] for entity in ENTITY_ORDER}, "entities": entities, "total_expected_rows": sum(EXPECTED_COUNTS.values())}
        (work_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        shutil.copyfile(INSTRUCTIONS, work_dir / "IMPORT-INSTRUCTIONS.md")
        zip_path = work_dir / ZIP_NAME
        deterministic_zip(work_dir, zip_path, ["manifest.json", "IMPORT-INSTRUCTIONS.md", *chunk_names])
        (work_dir / f"{ZIP_NAME}.sha256").write_text(f"{sha256(zip_path)}  {ZIP_NAME}\n", encoding="ascii", newline="\n")
        if output_dir.exists():
            shutil.rmtree(output_dir)
        work_dir.replace(output_dir)
        return manifest
    except Exception:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--created-at", default=dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"))
    args = parser.parse_args()
    manifest = build(args.input.resolve(), args.output.resolve(), args.created_at)
    print(json.dumps({"status": "pass", "output": str(args.output.resolve()), "total_rows": manifest["total_expected_rows"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
