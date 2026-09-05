#!/usr/bin/env python3
"""Verify Phase 3B private facts and sanitized aggregate boundaries locally."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import duckdb


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "data" / "dld" / "local" / "phase3b" / "phase3b.duckdb"
DEFAULT_REPORTS = ROOT / "reports" / "dld" / "phase3b"
EXPECTED_REPORTS = {
    "aggregate_summary.json",
    "authoritative_metadata.json",
    "deployment_architecture.json",
    "manifest.json",
    "metadata.json",
    "migration_proposal.json",
    "relationship_quality.json",
    "rental_reconciliation.json",
    "residential_index.json",
    "sanitized_samples.json",
    "schemas.json",
    "storage_performance.json",
    "suppression_summary.json",
    "transaction_classification.json",
    "transfer_contract.json",
}
PROHIBITED_TRANSFER_FIELDS = {
    "transaction_id",
    "contract_id",
    "line_number",
    "participant_id",
    "property_id",
    "unit_number",
    "land_number",
    "phone",
    "email",
    "fax",
    "nationality",
    "recorded_value",
    "annual_amount",
    "actual_area",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def scalar(conn: duckdb.DuckDBPyConnection, sql: str) -> Any:
    return conn.execute(sql).fetchone()[0]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    parser.add_argument("--reports", type=Path, default=DEFAULT_REPORTS)
    args = parser.parse_args()
    database = args.database.resolve()
    reports = args.reports.resolve()
    failures: list[str] = []
    checks = 0

    def check(condition: bool, message: str) -> None:
        nonlocal checks
        checks += 1
        if not condition:
            failures.append(message)

    check(database.is_file(), "private Phase 3B database missing")
    check(EXPECTED_REPORTS.issubset({path.name for path in reports.glob("*.json")}), "required safe report missing")
    if failures:
        print(json.dumps({"ok": False, "checks": checks, "failures": failures}, indent=2))
        return 1

    conn = duckdb.connect(str(database), read_only=True)
    check(scalar(conn, "select count(*) from transaction_facts_private") == 1_776_143, "transaction row reconciliation failed")
    check(scalar(conn, "select count(distinct transaction_id) from transaction_facts_private") == 1_776_143, "transaction key is not unique")
    check(scalar(conn, "select count(*) from rental_contract_lines_private") == 10_442_927, "rent-line reconciliation failed")
    check(scalar(conn, "select count(*) from rental_contract_facts_private") == 8_713_621, "rent-contract reconciliation failed")
    check(scalar(conn, "select count(distinct contract_id) from rental_contract_facts_private") == 8_713_621, "rent contracts are not unique")
    check(scalar(conn, "select count(*) from transaction_facts_private where economic_classification='eligible_market_sale'") == 1_290_990, "eligible-sale count drifted")
    check(scalar(conn, "select count(*) from transaction_facts_private where economic_classification='invalid_date'") == 4, "invalid transaction dates not quarantined")
    check(scalar(conn, "select count(*) from transaction_facts_private where procedure_relationship_state <> 'valid'") == 0, "procedure composite relationship is not uniquely valid")
    classifications = scalar(conn, "select sum(n) from (select count(*) n from transaction_facts_private group by economic_classification)")
    check(classifications == 1_776_143, "economic classifications do not reconcile")
    for field in ("procedure_relationship_state", "community_relationship_state", "project_relationship_state", "developer_relationship_state"):
        total = scalar(conn, f'select sum(n) from (select count(*) n from transaction_facts_private group by "{field}")')
        check(total == 1_776_143, f"relationship state does not reconcile: {field}")
    check(scalar(conn, "select sum(line_count) from rental_contract_facts_private") == 10_442_927, "contract rollup does not reconcile to lines")
    check(scalar(conn, "select count(*) from rental_contract_facts_private where contract_classification='eligible'") == 8_701_850, "eligible rent-contract count drifted")
    check(scalar(conn, "select count(*) from rental_contract_facts_private where contract_classification='start_after_export'") == 11_630, "future-start quarantine drifted")
    check(scalar(conn, "select count(*) from rental_contract_facts_private where contract_classification='duration_out_of_range'") == 141, "duration quarantine drifted")
    check(scalar(conn, "select count(*) from rental_contract_facts_private where contract_classification='eligible' and end_date > source_export_date") > 0, "valid future rent ends were incorrectly excluded")
    line_columns = {row[0] for row in conn.execute("describe rental_contract_lines_private").fetchall()}
    check(not {"annual_amount", "contract_amount"}.intersection(line_columns), "contract amounts duplicated onto rental lines")
    public_columns = {row[0] for row in conn.execute("describe public_aggregates_sanitized").fetchall()}
    check(not PROHIBITED_TRANSFER_FIELDS.intersection(public_columns), "prohibited field in public aggregate schema")
    check(scalar(conn, "select count(*) from public_aggregates_sanitized where observation_count < 10") == 0, "small cells entered public aggregates")
    check(scalar(conn, "select count(*) from public_aggregates_sanitized where metric_name not like '%_count' and metric_name not like '%_period_change' and observation_count < 30") == 0, "value statistic below 30 entered public aggregates")
    check(scalar(conn, "select count(*) from public_aggregates_sanitized where metric_name like '%_period_change' and (observation_count < 30 or completeness_state <> 'complete')") == 0, "invalid period-change row entered public aggregates")
    check(scalar(conn, "select count(*) from public_aggregates_sanitized where metric_name like 'sale_recorded_%'") == 0, "currency-dependent sale metric entered public aggregates")
    check(scalar(conn, "select count(*) from public_aggregates_sanitized where lower(metric_name) like '%yield%' or lower(metric_name) like '%primary%' or lower(metric_name) like '%secondary%' or lower(metric_name) like '%rent%unit%'") == 0, "blocked metric entered public aggregates")
    check(str(scalar(conn, "select max(period_start) from public_aggregates_sanitized where period_type='month' and completeness_state='complete'")) <= "2026-08-01", "complete-month boundary failed")
    check(str(scalar(conn, "select max(period_start) from public_aggregates_sanitized where period_type='quarter' and completeness_state='complete'")) <= "2026-04-01", "complete-quarter boundary failed")
    check(str(scalar(conn, "select max(period_start) from public_aggregates_sanitized where period_type='year' and completeness_state='complete'")) <= "2025-01-01", "complete-year boundary failed")
    sale_reconcile = scalar(conn, "select sum(observation_count) from aggregate_cells_private where data_domain='sales' and entity_key='dubai' and segment_type='all' and period_type='year'")
    rent_reconcile = scalar(conn, "select sum(observation_count) from aggregate_cells_private where data_domain='rent' and entity_key='dubai' and segment_type='all' and period_type='year'")
    check(int(sale_reconcile) == 1_290_990, "Dubai annual sale aggregates do not reconcile")
    check(int(rent_reconcile) == 8_701_850, "Dubai annual rent aggregates do not reconcile")
    check(scalar(conn, "select count(*) from dim_communities where name_ar is not null and name_en is not null") > 0, "bilingual community dimensions missing")
    check(scalar(conn, "select count(*) from residential_sale_index_private") == 2_862, "Residential Sale Index normalization failed")
    check(scalar(conn, "select count(*) from source_files_private") == 62, "source-file manifest reconciliation failed")
    check(scalar(conn, "select count(*) from source_schema_fingerprints_private") == 25, "schema-fingerprint reconciliation failed")
    conn.close()

    manifest = json.loads((reports / "manifest.json").read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        path = reports / entry["file"]
        check(path.is_file() and path.stat().st_size == entry["bytes"] and sha256_file(path) == entry["sha256"], f"report manifest mismatch: {entry['file']}")

    transfer = json.loads((reports / "transfer_contract.json").read_text(encoding="utf-8"))["artifact"]
    transfer_path = Path(transfer["path"])
    check(transfer_path.is_file(), "sanitized aggregate artifact missing")
    if transfer_path.is_file():
        check(transfer_path.stat().st_size == transfer["bytes"] and sha256_file(transfer_path) == transfer["sha256"], "sanitized artifact hash/size mismatch")
        rows = 0
        bad_entities = 0
        bad_metrics = 0
        bad_fields = 0
        bad_small = 0
        with transfer_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                record = json.loads(line)
                rows += 1
                bad_entities += record["entity_type"] not in {"dubai", "community", "project", "developer"}
                bad_metrics += any(token in record["metric_name"] for token in ("recorded", "yield", "primary", "secondary", "unit_price"))
                bad_fields += bool(PROHIBITED_TRANSFER_FIELDS.intersection(record))
                bad_small += record["observation_count"] < 10
        check(rows == transfer["rows"], "sanitized artifact row count mismatch")
        check(not bad_entities, "invalid public entity type")
        check(not bad_metrics, "blocked metric in sanitized artifact")
        check(not bad_fields, "prohibited field in sanitized artifact")
        check(not bad_small, "small cell in sanitized artifact")

    samples = json.loads((reports / "sanitized_samples.json").read_text(encoding="utf-8"))
    check(all(not PROHIBITED_TRANSFER_FIELDS.intersection(item) for item in samples), "prohibited field in tracked samples")
    metadata = json.loads((reports / "metadata.json").read_text(encoding="utf-8"))
    check(metadata["remote_connections"] == 0, "remote connection boundary failed")
    check(metadata["transaction_currency_status"] == "unresolved", "transaction currency boundary weakened")
    check(metadata["rental_actual_area_unit_status"] == "unresolved", "rent area-unit boundary weakened")

    result = {"ok": not failures, "checks": checks, "failures": failures}
    write_path = reports / "verification.json"
    write_path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
