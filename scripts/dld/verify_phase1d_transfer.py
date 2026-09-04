#!/usr/bin/env python3
"""Independently verify the completed Phase 1D directory transfer package."""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import re
import tempfile
import zipfile
from pathlib import Path

import duckdb

from phase1d_contract import ARABIC_RE, ENTITY_ORDER, EXPECTED_COUNTS, MAX_CHUNK_BYTES, SCHEMA_VERSION, validate_envelope
from build_phase1d_transfer import DEFAULT_INPUT, DEFAULT_OUTPUT, ZIP_NAME, build

SECRET_RE = re.compile(
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----|"
    r"\bsk-[A-Za-z0-9_-]{20,}\b|\bsb_secret_[A-Za-z0-9_-]{20,}\b|"
    r"\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|"
    r"postgres(?:ql)?://[^\s:/]+:[^\s@]+@",
    re.I,
)


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            value.update(chunk)
    return value.hexdigest()


def verify(package: Path) -> dict:
    checks: list[dict] = []
    def check(name: str, passed: bool, detail=None) -> None:
        checks.append({"check": name, "status": "pass" if passed else "fail", "detail": detail})

    manifest = json.loads((package / "manifest.json").read_text(encoding="utf-8"))
    check("schema version", manifest.get("schema_version") == SCHEMA_VERSION, manifest.get("schema_version"))
    check("upload order", tuple(manifest.get("upload_order", [])) == ENTITY_ORDER)
    check("manifest expected_counts shape", manifest.get("expected_counts") == {entity: EXPECTED_COUNTS[entity] for entity in ENTITY_ORDER}, manifest.get("expected_counts"))
    all_keys: set[tuple[str, str]] = set()
    actual_counts: dict[str, int] = {}
    chunk_names: list[str] = []
    prohibited: list[str] = []
    invalid_json: list[str] = []
    secret_hits: list[str] = []
    arabic_entities: set[str] = set()
    payloads: dict[str, list[dict]] = {entity: [] for entity in ENTITY_ORDER if entity != "permits"}
    stable_field_names = {
        "developers": "developer_number", "brokers": "broker_number", "offices": "office_number",
        "projects": "project_number", "permits": "permit_number", "escrow_agents": "escrow_agent_number",
        "free_zone_companies": "company_number",
    }
    stable: dict[str, Counter] = {entity: Counter() for entity in stable_field_names}
    for item in manifest["entities"]:
        entity = item["entity_type"]
        count = 0
        for chunk in item["chunks"]:
            path = package / chunk["filename"]
            chunk_names.append(chunk["filename"])
            check(f"chunk exists {chunk['filename']}", path.is_file())
            if not path.is_file():
                continue
            check(f"chunk size {chunk['filename']}", path.stat().st_size == chunk["bytes"] and path.stat().st_size <= MAX_CHUNK_BYTES, path.stat().st_size)
            check(f"chunk hash {chunk['filename']}", digest(path) == chunk["sha256"])
            raw = path.read_bytes()
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError as exc:
                invalid_json.append(f"{path.name}: invalid UTF-8 {exc}")
                continue
            if ARABIC_RE.search(text):
                arabic_entities.add(entity)
            if SECRET_RE.search(text):
                secret_hits.append(path.name)
            rows = text.splitlines()
            check(f"chunk rows {chunk['filename']}", len(rows) == chunk["row_count"], len(rows))
            for line_number, line in enumerate(rows, 1):
                try:
                    record = json.loads(line)
                except json.JSONDecodeError as exc:
                    invalid_json.append(f"{path.name}:{line_number}: {exc}")
                    continue
                errors = validate_envelope(record)
                prohibited.extend(f"{path.name}:{line_number}: {error}" for error in errors)
                identity = (record.get("entity_type"), record.get("source_key"))
                if identity in all_keys:
                    prohibited.append(f"duplicate entity/source key {identity}")
                all_keys.add(identity)
                if entity in stable_field_names:
                    stable[entity][record["payload"][stable_field_names[entity]]] += 1
                if entity != "permits":
                    payloads[entity].append(record["payload"])
                count += 1
        actual_counts[entity] = count
        check(f"entity count {entity}", count == EXPECTED_COUNTS.get(entity), count)
    check("all entity counts", actual_counts == EXPECTED_COUNTS, actual_counts)
    check("total expected rows", sum(actual_counts.values()) == manifest["total_expected_rows"] == sum(EXPECTED_COUNTS.values()), sum(actual_counts.values()))
    check("valid JSON and UTF-8", not invalid_json, invalid_json[:20])
    check("valid contract and prohibited-field scan", not prohibited, prohibited[:20])
    for metadata_name in ("manifest.json", "IMPORT-INSTRUCTIONS.md"):
        if SECRET_RE.search((package / metadata_name).read_text(encoding="utf-8")):
            secret_hits.append(metadata_name)
    check("high-confidence secret scan", not secret_hits, secret_hits)
    check("Arabic preserved", len(arabic_entities) >= 10, sorted(arabic_entities))
    check("no search-index rows", "search_index" not in actual_counts and not any("search" in name for name in chunk_names))

    collisions = {entity: [key for key, count in values.items() if not key or count != 1] for entity, values in stable.items()}
    check("stable public identifiers unique", not any(collisions.values()), collisions)
    community_parents = Counter((row["municipality_number"], row["name_en"], row["name_ar"]) for row in payloads["communities"])
    relationship_errors: list[str] = []
    relationship_warnings: list[str] = []

    def relation(entity: str, row: dict, relation_name: str, state: str, identifier, parents: Counter) -> None:
        matches = parents.get(identifier, 0) if identifier is not None else 0
        if state == "unmatched" and identifier is None:
            relationship_warnings.append(f"{entity}:{relation_name}")
        elif state == "matched" and matches != 1:
            relationship_errors.append(f"{entity}:{relation_name}:matched:{identifier}:{matches}")
        elif state in {"none", "unmatched"} and identifier is not None:
            relationship_errors.append(f"{entity}:{relation_name}:{state}:identifier-present")
        elif state not in {"matched", "none", "unmatched"}:
            relationship_errors.append(f"{entity}:{relation_name}:invalid-state:{state}")

    for row in payloads["projects"]:
        relation("projects", row, "developer", row["developer_relationship_state"], row["developer_number"], stable["developers"])
        relation("projects", row, "master_developer", "matched", row["master_developer_number"], stable["developers"])
        community_key = (row["community_municipality_number"], row["community_name_en"], row["community_name_ar"])
        relation("projects", row, "community", row["community_relationship_state"], community_key, community_parents)
        relation("projects", row, "escrow", row["escrow_relationship_state"], row["escrow_agent_number"], stable["escrow_agents"])
    for row in payloads["broker_office_links"]:
        relation("broker_office_links", row, "broker", "matched", row["broker_number"], stable["brokers"])
        relation("broker_office_links", row, "office", row["office_relationship_state"], row["office_number"], stable["offices"])
    for row in payloads["office_activities"]:
        relation("office_activities", row, "office", "matched", row["office_number"], stable["offices"])
    for row in payloads["licences"]:
        relation("licences", row, "office", row["office_relationship_state"], row["office_number"], stable["offices"])
        relation("licences", row, "developer", row["developer_relationship_state"], row["developer_number"], stable["developers"])
    check("relationship references valid and unambiguous", not relationship_errors, relationship_errors[:20])
    warning_counts = dict(sorted(Counter(relationship_warnings).items()))
    check("unmatched relationships explicitly reported", bool(relationship_warnings), warning_counts)
    source_dir = DEFAULT_INPUT
    conn = duckdb.connect()
    try:
        source_audit = {
            "broker_office_links:office": conn.execute(
                "select count(*),count_if(o.office_id is not null) from read_parquet(?) l left join read_parquet(?) o on o.office_number=l.office_number where l.office_id is null",
                [str(source_dir / "broker_office_links.parquet"), str(source_dir / "offices.parquet")],
            ).fetchone(),
            "projects:developer": conn.execute(
                "select count(*),count_if(d.developer_id is not null) from read_parquet(?) p left join read_parquet(?) d on d.developer_number=p.developer_number where p.developer_id is null and (p.source_developer_id is not null or p.developer_number is not null or p.source_developer_name is not null)",
                [str(source_dir / "projects.parquet"), str(source_dir / "developers.parquet")],
            ).fetchone(),
            "projects:escrow": conn.execute(
                "select count(*),count_if(e.escrow_agent_number is not null) from read_parquet(?) p left join read_parquet(?) e on e.escrow_agent_number=p.source_escrow_agent_number where p.escrow_agent_number is null and p.source_escrow_agent_number is not null",
                [str(source_dir / "projects.parquet"), str(source_dir / "escrow_agents.parquet")],
            ).fetchone(),
        }
    finally:
        conn.close()
    source_audit_result = {key: {"unmatched": int(value[0]), "resolvable_by_official_number": int(value[1])} for key, value in source_audit.items()}
    check("all source unmatched identifiers are unresolvable", sum(value["unmatched"] for value in source_audit_result.values()) == 184 and all(value["resolvable_by_official_number"] == 0 for value in source_audit_result.values()), source_audit_result)
    check("source and transfer unmatched reports agree", warning_counts == {key: value["unmatched"] for key, value in source_audit_result.items()}, source_audit_result)
    allowed_names = {"manifest.json", "IMPORT-INSTRUCTIONS.md", ZIP_NAME, f"{ZIP_NAME}.sha256", *chunk_names}
    actual_names = {path.name for path in package.iterdir() if path.is_file()}
    check("no raw or private files", actual_names == allowed_names, sorted(actual_names - allowed_names))
    zip_path = package / ZIP_NAME
    with zipfile.ZipFile(zip_path) as archive:
        zip_names = archive.namelist()
        expected_zip = ["manifest.json", "IMPORT-INSTRUCTIONS.md", *chunk_names]
        check("ZIP exact contents", zip_names == expected_zip, zip_names)
        check("ZIP entries match files", all(archive.read(name) == (package / name).read_bytes() for name in expected_zip))
    sidecar = (package / f"{ZIP_NAME}.sha256").read_text(encoding="ascii").split()[0]
    check("ZIP SHA-256", sidecar == digest(zip_path), sidecar)
    return {"status": "pass" if all(item["status"] == "pass" for item in checks) else "fail", "counts": actual_counts, "relationship_warnings": warning_counts, "unmatched_source_audit": source_audit_result, "chunk_count": len(chunk_names), "zip_bytes": zip_path.stat().st_size, "zip_sha256": digest(zip_path), "checks": checks}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--determinism", action="store_true")
    args = parser.parse_args()
    result = verify(args.package.resolve())
    if args.determinism and result["status"] == "pass":
        manifest = json.loads((args.package / "manifest.json").read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory(prefix="phase1d-verify-", dir=args.package.parent) as temp:
            regenerated = Path(temp) / "package"
            build(DEFAULT_INPUT, regenerated, manifest["package_created_at"])
            expected = {p.name: digest(p) for p in args.package.iterdir() if p.is_file()}
            actual = {p.name: digest(p) for p in regenerated.iterdir() if p.is_file()}
            passed = expected == actual
            result["checks"].append({"check": "deterministic regeneration", "status": "pass" if passed else "fail", "detail": None if passed else {"expected": expected, "actual": actual}})
            if not passed:
                result["status"] = "fail"
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
