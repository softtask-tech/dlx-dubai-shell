#!/usr/bin/env python3
"""Validate Phase 1A Parquet files, or explicitly stage and atomically publish them later.

The default is a network-free dry run. --execute is intentionally required and
was not used during Phase 1A.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterator

import duckdb


KEYS = {
    "communities": "area_id", "developers": "developer_id", "projects": "project_id",
    "brokers": "broker_id", "broker_office_links": "broker_id || ':' || source_office_id",
    "offices": "office_id", "office_activities": "activity_key",
    "licences": "licence_key", "permits": "permit_id", "valuators": "valuator_key",
    "escrow_agents": "escrow_agent_number", "owner_associations": "association_key",
    "free_zone_companies": "company_number",
}


def json_value(value: Any) -> Any:
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.hex()
    return value


def records(path: Path, key_sql: str, batch_size: int) -> Iterator[list[dict[str, Any]]]:
    conn = duckdb.connect()
    cursor = conn.execute(f"SELECT {key_sql} AS _source_key, * FROM read_parquet(?) ORDER BY 1", [str(path)])
    names = [item[0] for item in cursor.description]
    while rows := cursor.fetchmany(batch_size):
        yield [
            {"source_key": str(row[0]), "payload": {name: json_value(value) for name, value in zip(names[1:], row[1:])}}
            for row in rows
        ]
    conn.close()


def request(url: str, key: str, method: str, path: str, body: Any, prefer: str | None = None) -> Any:
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(url.rstrip("/") + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Supabase request failed ({exc.code}): {exc.read().decode('utf-8', 'replace')}") from exc
    return json.loads(raw) if raw else None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("data/dld/directory/phase1a"))
    parser.add_argument("--report", type=Path, default=Path("reports/dld/phase1a/summary.json"))
    parser.add_argument("--batch-size", type=int, default=250)
    parser.add_argument("--execute", action="store_true", help="Connect, stage, and call the atomic publish RPC")
    parser.add_argument("--run-id", help="Resume an existing staging run idempotently")
    args = parser.parse_args()

    summary = json.loads(args.report.read_text(encoding="utf-8"))
    expected = {name: int(summary["output_counts"][name]) for name in KEYS}
    conn = duckdb.connect()
    actual = {}
    duplicates = {}
    for entity, key_sql in KEYS.items():
        path = args.input / f"{entity}.parquet"
        actual[entity] = conn.execute("SELECT count(*) FROM read_parquet(?)", [str(path)]).fetchone()[0]
        duplicates[entity] = conn.execute(
            f"SELECT count(*) - count(DISTINCT {key_sql}) FROM read_parquet(?)", [str(path)]
        ).fetchone()[0]
    conn.close()
    if actual != expected or any(duplicates.values()):
        print(json.dumps({"status": "fail", "expected": expected, "actual": actual, "duplicate_keys": duplicates}, indent=2))
        return 1

    if not args.execute:
        print(json.dumps({"status": "pass", "mode": "dry-run", "network_used": False, "counts": actual, "duplicate_keys": duplicates}, indent=2))
        return 0

    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        parser.error("--execute requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    if args.run_id:
        run_id = args.run_id
    else:
        run = request(
            supabase_url, service_key, "POST", "/rest/v1/dld_directory_import_runs?select=import_run_id",
            {"source_manifest": summary["output_manifest"], "expected_counts": expected}, "return=representation",
        )
        run_id = run[0]["import_run_id"]
    for entity, key_sql in KEYS.items():
        for batch in records(args.input / f"{entity}.parquet", key_sql, args.batch_size):
            payload = [{"import_run_id": run_id, "entity_type": entity, **item} for item in batch]
            request(
                supabase_url, service_key, "POST",
                "/rest/v1/dld_directory_stage?on_conflict=import_run_id,entity_type,source_key",
                payload, "resolution=merge-duplicates",
            )
    request(supabase_url, service_key, "POST", "/rest/v1/rpc/publish_dld_directory", {"target_run_id": run_id})
    print(json.dumps({"status": "published", "import_run_id": run_id, "counts": actual}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
