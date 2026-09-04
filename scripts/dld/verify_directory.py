#!/usr/bin/env python3
"""Verify Phase 1A reports, sanitized Parquet, SQL contracts, and dry-run import."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "reports/dld/phase1a"
OUTPUT = ROOT / "data/dld/directory/phase1a"
FORBIDDEN = {"phone", "email", "fax", "webpage", "gender", "nationality", "parcel_id", "rent_contract_no"}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            value.update(chunk)
    return value.hexdigest()


def main() -> int:
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object = None) -> None:
        checks.append({"check": name, "status": "pass" if passed else "fail", "detail": detail})

    validation = json.loads((REPORTS / "validation.json").read_text(encoding="utf-8"))
    summary = json.loads((REPORTS / "summary.json").read_text(encoding="utf-8"))
    schema = json.loads((REPORTS / "schema.json").read_text(encoding="utf-8"))
    check("builder validation", validation["status"] == "pass", validation["status"])
    check("source set", validation["approved_source_dataset_count"] == 11, validation["approved_source_dataset_count"])
    check("idempotent rewrite", validation["idempotent_rerun"] is True)
    check("all key tests", all(row["status"] == "pass" for row in validation["unique_key_tests"]))
    check("all search tests", all(row["status"] == "pass" for row in validation["search_tests"]))
    check("public field scan", not validation["forbidden_public_fields_found"])

    manifest = {row["file"]: row for row in summary["output_manifest"]}
    conn = duckdb.connect()
    for filename, expected in manifest.items():
        path = OUTPUT / filename
        check(f"manifest {filename}", path.is_file() and path.stat().st_size == expected["bytes"] and digest(path) == expected["sha256"])
        entity = path.stem
        count = conn.execute("SELECT count(*) FROM read_parquet(?)", [str(path)]).fetchone()[0]
        check(f"count {entity}", count == summary["output_counts"][entity], count)
        columns = {row[0].lower() for row in conn.execute("DESCRIBE SELECT * FROM read_parquet(?)", [str(path)]).fetchall()}
        check(f"private columns absent {entity}", not any(any(term in field for term in FORBIDDEN) for field in columns), sorted(columns & FORBIDDEN))
    link_checks = {
        "project developer matched links": """select count(*) from read_parquet(?) p left join read_parquet(?) d on p.developer_id=d.developer_id where p.developer_id is not null and d.developer_id is null""",
        "broker office matched links": """select count(*) from read_parquet(?) b left join read_parquet(?) o on b.office_id=o.office_id where b.office_id is not null and o.office_id is null""",
        "licence office matched links": """select count(*) from read_parquet(?) l left join read_parquet(?) o on l.matched_office_id=o.office_id where l.matched_office_id is not null and o.office_id is null""",
        "licence developer matched links": """select count(*) from read_parquet(?) l left join read_parquet(?) d on l.matched_developer_id=d.developer_id where l.matched_developer_id is not null and d.developer_id is null""",
    }
    link_files = {
        "project developer matched links": (OUTPUT / "projects.parquet", OUTPUT / "developers.parquet"),
        "broker office matched links": (OUTPUT / "broker_office_links.parquet", OUTPUT / "offices.parquet"),
        "licence office matched links": (OUTPUT / "licences.parquet", OUTPUT / "offices.parquet"),
        "licence developer matched links": (OUTPUT / "licences.parquet", OUTPUT / "developers.parquet"),
    }
    for name, sql_query in link_checks.items():
        invalid = conn.execute(sql_query, [str(path) for path in link_files[name]]).fetchone()[0]
        check(name, invalid == 0, invalid)
    conn.close()

    visible = {row["field"].lower() for row in schema if row["visibility"] == "public"}
    check("schema privacy classification", not any(any(term in field for term in FORBIDDEN) for field in visible))
    sql = "\n".join(path.read_text(encoding="utf-8") for path in sorted((ROOT / "supabase/migrations").glob("20260904010*_dld_directory_*.sql")))
    check("migration is additive", "drop table" not in sql.lower() and "truncate" not in sql.lower())
    check("curated links nullable", "dld_directory_area_id text" in sql and "dld_directory_developer_id text" in sql and "dld_directory_project_id text" in sql)
    check("RLS enabled", "enable row level security" in sql.lower())
    check("atomic advisory lock", "pg_advisory_xact_lock" in sql)
    check("non-affiliation text", validation["non_affiliation_wording"] in sql)

    dry_run = subprocess.run(
        [sys.executable, str(ROOT / "scripts/dld/import_directory.py")], cwd=ROOT,
        capture_output=True, text=True, encoding="utf-8",
    )
    check("import dry run", dry_run.returncode == 0 and '"network_used": false' in dry_run.stdout.lower(), dry_run.stdout or dry_run.stderr)
    result = {"status": "pass" if all(row["status"] == "pass" for row in checks) else "fail", "checks": checks}
    (REPORTS / "verification.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=True))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
