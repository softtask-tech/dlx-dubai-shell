#!/usr/bin/env python3
"""Build deterministic private Phase 3B facts and sanitized aggregates locally."""

from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any

import duckdb


ROOT = Path(__file__).resolve().parents[2]
PHASE0_DB = ROOT / "data" / "dld" / "local" / "phase0.duckdb"
PHASE3A_REPORTS = ROOT / "reports" / "dld" / "phase3a"
DEFAULT_OUTPUT = ROOT / "data" / "dld" / "local" / "phase3b"
DEFAULT_REPORTS = ROOT / "reports" / "dld" / "phase3b"
METHODOLOGY_VERSION = "dld-market-aggregation-phase3b-v1"
SOURCE_EXPORT_DATE = date(2026, 9, 4)
RESEARCH_ACCESS_DATE = date(2026, 9, 6)
SALE_KEYS = ((1, 11), (1, 41), (1, 102), (1, 460))
INDEX_SOURCE_URL = "https://dubailand.gov.ae/en/open-data/residential-properties-price-index-rppi/"
INDEX_METHODOLOGY_URL = "https://dubailand.gov.ae/media/qnslugbi/the-dubai-house-price-index-methodology.pdf"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True, default=json_default) + "\n",
        encoding="utf-8",
    )


def json_default(value: Any) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(type(value).__name__)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def source_package_hash() -> str:
    inventory = read_json(PHASE3A_REPORTS / "inventory.json")
    entries = []
    for dataset in inventory:
        for item in dataset["files"]:
            entries.append(f'{item["path"]}|{item["compressed_bytes"]}|{item["sha256"]}')
    payload = "\n".join(sorted(entries)).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def date_expr(field: str) -> str:
    source = f"nullif(trim({field}), '')"
    return (
        f"coalesce(try_cast({source} as timestamp), try_strptime({source}, '%d-%m-%Y'), "
        f"try_strptime({source}, '%d/%m/%Y'), try_strptime({source}, '%Y-%m-%d'), "
        f"try_strptime({source}, '%Y-%m-%d %H:%M:%S'))::date"
    )


def integer_expr(field: str) -> str:
    return f"try_cast(nullif(trim({field}), '') as bigint)"


def number_expr(field: str) -> str:
    return f"try_cast(nullif(trim({field}), '') as double)"


def rows_dict(conn: duckdb.DuckDBPyConnection, sql: str) -> list[dict[str, Any]]:
    cursor = conn.execute(sql)
    fields = [item[0] for item in cursor.description]
    return [dict(zip(fields, row)) for row in cursor.fetchall()]


def row_dict(conn: duckdb.DuckDBPyConnection, sql: str) -> dict[str, Any]:
    return rows_dict(conn, sql)[0]


def scalar(conn: duckdb.DuckDBPyConnection, sql: str) -> Any:
    return conn.execute(sql).fetchone()[0]


def peak_working_set_bytes() -> int | None:
    if os.name != "nt":
        return None

    class Counters(ctypes.Structure):
        _fields_ = [
            ("cb", ctypes.c_ulong),
            ("PageFaultCount", ctypes.c_ulong),
            ("PeakWorkingSetSize", ctypes.c_size_t),
            ("WorkingSetSize", ctypes.c_size_t),
            ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
            ("QuotaPagedPoolUsage", ctypes.c_size_t),
            ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
            ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
            ("PagefileUsage", ctypes.c_size_t),
            ("PeakPagefileUsage", ctypes.c_size_t),
        ]

    counters = Counters()
    counters.cb = ctypes.sizeof(counters)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    psapi = ctypes.WinDLL("psapi", use_last_error=True)
    kernel32.GetCurrentProcess.restype = wintypes.HANDLE
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
    psapi.GetProcessMemoryInfo.restype = wintypes.BOOL
    process = kernel32.GetCurrentProcess()
    ok = psapi.GetProcessMemoryInfo(process, ctypes.byref(counters), counters.cb)
    return int(counters.PeakWorkingSetSize) if ok else None


def create_dimensions(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute(
        """
        create table dim_communities as
        select try_cast(area_id as bigint) area_id, min(name_en) name_en, min(name_ar) name_ar
        from src.areas where try_cast(area_id as bigint) is not null group by 1;

        create table dim_developers as
        select try_cast(developer_id as bigint) developer_id,
          min(developer_number) developer_number,
          min(developer_name_en) name_en, min(developer_name_ar) name_ar
        from src.developers where try_cast(developer_id as bigint) is not null group by 1;

        create table dim_projects as
        select try_cast(p.project_number as bigint) project_number,
          min(p.project_name) name_en, cast(null as varchar) name_ar,
          min(try_cast(p.area_id as bigint)) area_id,
          min(try_cast(p.developer_id as bigint)) developer_id,
          count(*) source_rows
        from src.projects p where try_cast(p.project_number as bigint) is not null group by 1;

        create table dim_transaction_groups as
        select try_cast(group_id as bigint) group_id, min(name_en) name_en, min(name_ar) name_ar
        from src.transaction_groups where try_cast(group_id as bigint) is not null group by 1;

        create table dim_transaction_procedures as
        select try_cast(group_id as bigint) group_id, try_cast(procedure_id as bigint) procedure_id,
          min(name_en) name_en, min(name_ar) name_ar,
          bool_or(try_cast(is_pre_registration as bigint) = 1) is_pre_registration,
          count(*) source_rows
        from src.transaction_procedures
        where try_cast(group_id as bigint) is not null and try_cast(procedure_id as bigint) is not null
        group by 1,2;

        create table dim_transaction_registration_types as
        select try_cast(reg_type_id as bigint) registration_type_id,
          min(reg_type_en) name_en, min(reg_type_ar) name_ar, count(*) source_rows
        from src.transactions where try_cast(reg_type_id as bigint) is not null group by 1;

        create table dim_transaction_property_types as
        select try_cast(property_type_id as bigint) property_type_id,
          min(property_type_en) name_en, min(property_type_ar) name_ar, count(*) source_rows
        from src.transactions where try_cast(property_type_id as bigint) is not null group by 1;

        create table dim_transaction_property_subtypes as
        select try_cast(property_sub_type_id as bigint) property_subtype_id,
          min(property_sub_type_en) name_en, min(property_sub_type_ar) name_ar, count(*) source_rows
        from src.transactions where try_cast(property_sub_type_id as bigint) is not null group by 1;

        create table dim_rent_registration_types as
        select try_cast(contract_reg_type_id as bigint) registration_type_id,
          min(contract_reg_type_en) name_en, min(contract_reg_type_ar) name_ar, count(*) source_rows
        from src.rent_contracts where try_cast(contract_reg_type_id as bigint) is not null group by 1;
        """
    )


def create_transaction_facts(conn: duckdb.DuckDBPyConnection) -> None:
    tx_date = date_expr("t.instance_date")
    group_id = integer_expr("t.trans_group_id")
    procedure_id = integer_expr("t.procedure_id")
    area_id = integer_expr("t.area_id")
    project_number = integer_expr("t.project_number")
    registration_type_id = integer_expr("t.reg_type_id")
    property_type_id = integer_expr("t.property_type_id")
    subtype_id = integer_expr("t.property_sub_type_id")
    value = number_expr("t.actual_worth")
    area = number_expr("t.procedure_area")
    allowlist = ",".join(f"({group},{procedure})" for group, procedure in SALE_KEYS)
    conn.execute(
        f"""
        create table transaction_facts_private as
        with normalized as (
          select t.transaction_id, {tx_date} transaction_date,
            {group_id} group_id, {procedure_id} procedure_id,
            {area_id} area_id, {project_number} project_number,
            {registration_type_id} registration_type_id,
            {property_type_id} property_type_id, {subtype_id} property_subtype_id,
            {value} recorded_value, {area} procedure_area_sqm
          from src.transactions t
        )
        select n.*,
          case
            when n.transaction_date is null or n.transaction_date < date '1900-01-01'
              or n.transaction_date > date '{SOURCE_EXPORT_DATE.isoformat()}' then 'invalid_date'
            when coalesce(pr.source_rows, 0) <> 1 then 'other_non_market'
            when (n.group_id, n.procedure_id) in (values {allowlist}) then 'eligible_market_sale'
            when n.group_id = 2 then 'mortgage'
            when n.group_id = 3 then 'gift'
            when n.group_id = 1 then 'excluded_sales_procedure'
            else 'other_non_market'
          end economic_classification,
          case when coalesce(pr.source_rows, 0) = 1 then 'valid' when pr.source_rows > 1 then 'ambiguous' else 'invalid' end procedure_relationship_state,
          case when c.area_id is not null then 'matched' else 'unmatched' end community_relationship_state,
          case when p.project_number is not null and p.source_rows = 1 then 'matched' else 'unmatched' end project_relationship_state,
          p.developer_id,
          case when p.project_number is not null and p.source_rows = 1 and d.developer_id is not null then 'matched' else 'unmatched' end developer_relationship_state,
          case when n.recorded_value > 0 and n.procedure_area_sqm > 0 then n.recorded_value / n.procedure_area_sqm end recorded_value_per_sqm,
          date_trunc('month', n.transaction_date)::date month_start,
          date_trunc('quarter', n.transaction_date)::date quarter_start,
          date_trunc('year', n.transaction_date)::date year_start,
          date '{SOURCE_EXPORT_DATE.isoformat()}' source_export_date,
          '{METHODOLOGY_VERSION}' methodology_version
        from normalized n
        left join dim_transaction_procedures pr using (group_id, procedure_id)
        left join dim_communities c using (area_id)
        left join dim_projects p using (project_number)
        left join dim_developers d on d.developer_id = p.developer_id;

        create unique index transaction_facts_private_key on transaction_facts_private(transaction_id);
        """
    )


def create_rental_facts(conn: duckdb.DuckDBPyConnection) -> None:
    start = date_expr("r.contract_start_date")
    end = date_expr("r.contract_end_date")
    area_id = integer_expr("r.area_id")
    project = integer_expr("r.project_number")
    conn.execute(
        f"""
        create table rental_contract_lines_private as
        select r.contract_id, try_cast(r.line_number as bigint) line_number,
          {area_id} area_id, {project} project_number,
          try_cast(r.ejari_property_type_id as bigint) property_type_id,
          try_cast(r.ejari_property_sub_type_id as bigint) property_subtype_id,
          try_cast(r.ejari_bus_property_type_id as bigint) business_property_type_id,
          case when c.area_id is not null then 'matched' else 'unmatched' end community_relationship_state,
          case when p.project_number is not null and p.source_rows = 1 then 'matched' else 'unmatched' end project_relationship_state,
          date '{SOURCE_EXPORT_DATE.isoformat()}' source_export_date,
          '{METHODOLOGY_VERSION}' methodology_version
        from src.rent_contracts r
        left join dim_communities c on c.area_id = {area_id}
        left join dim_projects p on p.project_number = {project};

        create unique index rental_contract_lines_private_key
          on rental_contract_lines_private(contract_id, line_number);

        create table rental_contract_facts_private as
        with rollup as (
          select r.contract_id, count(*) line_count,
            min({start}) start_date, max({start}) max_start_date,
            min({end}) end_date, max({end}) max_end_date,
            count(*) filter (where {start} is null) invalid_start_lines,
            count(*) filter (where {end} is null) invalid_end_lines,
            min({number_expr('r.contract_amount')}) contract_amount,
            max({number_expr('r.contract_amount')}) max_contract_amount,
            min({number_expr('r.annual_amount')}) annual_amount,
            max({number_expr('r.annual_amount')}) max_annual_amount,
            min(try_cast(r.contract_reg_type_id as bigint)) registration_type_id,
            max(try_cast(r.contract_reg_type_id as bigint)) max_registration_type_id,
            max(try_cast(r.no_of_prop as bigint)) declared_property_count,
            count(distinct {area_id}) distinct_area_ids,
            count(*) filter (where {area_id} is null or c.area_id is null) unresolved_area_lines,
            min({area_id}) candidate_area_id,
            count(distinct {project}) distinct_project_numbers,
            count(*) filter (where {project} is null or p.project_number is null or p.source_rows <> 1) unresolved_project_lines,
            min({project}) candidate_project_number
          from src.rent_contracts r
          left join dim_communities c on c.area_id = {area_id}
          left join dim_projects p on p.project_number = {project}
          group by r.contract_id
        ), typed as (
          select *, date_diff('day', start_date, end_date) + 1 duration_days,
            start_date is not distinct from max_start_date
              and end_date is not distinct from max_end_date
              and contract_amount is not distinct from max_contract_amount
              and annual_amount is not distinct from max_annual_amount
              and registration_type_id is not distinct from max_registration_type_id header_consistent
          from rollup
        )
        select *,
          case
            when invalid_start_lines > 0 or invalid_end_lines > 0 then 'unparseable_date'
            when start_date > date '{SOURCE_EXPORT_DATE.isoformat()}' then 'start_after_export'
            when end_date < start_date then 'end_before_start'
            when duration_days < 1 or duration_days > 3660 then 'duration_out_of_range'
            else 'eligible'
          end contract_classification,
          header_consistent and annual_amount > 0 amount_eligible,
          case when distinct_area_ids = 1 and unresolved_area_lines = 0 then candidate_area_id end safe_area_id,
          case when distinct_project_numbers = 1 and unresolved_project_lines = 0 then candidate_project_number end safe_project_number,
          line_count <> declared_property_count declared_property_count_mismatch,
          date_trunc('month', start_date)::date month_start,
          date_trunc('quarter', start_date)::date quarter_start,
          date_trunc('year', start_date)::date year_start,
          date '{SOURCE_EXPORT_DATE.isoformat()}' source_export_date,
          '{METHODOLOGY_VERSION}' methodology_version
        from typed;

        create unique index rental_contract_facts_private_key on rental_contract_facts_private(contract_id);
        """
    )


def create_index_facts(conn: duckdb.DuckDBPyConnection) -> None:
    unions = []
    for category, prefix in (("all", "all"), ("flat", "flat"), ("villa", "villa")):
        for period_type in ("monthly", "quarterly", "yearly"):
            for value_type, suffix in (("index", "index"), ("price_index", "price_index")):
                field = f"{prefix}_{period_type}_{suffix}"
                unions.append(
                    f"select try_cast(first_date_of_month as date) source_period, '{category}' category, "
                    f"'{period_type}' period_type, '{value_type}' value_type, {number_expr(field)} official_value "
                    "from src.residential_sale_index"
                )
    conn.execute(
        "create table residential_sale_index_private as "
        + " union all ".join(unions)
        + f"; alter table residential_sale_index_private add column source_export_date date default date '{SOURCE_EXPORT_DATE.isoformat()}';"
    )


def create_quarantine_and_quality(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute(
        """
        create table relationship_quarantine_private as
        select 'transaction' source_kind, sha256(transaction_id) source_key_hash,
          'invalid_transaction_date' issue
        from transaction_facts_private where economic_classification = 'invalid_date'
        union all
        select 'transaction', sha256(transaction_id), 'invalid_or_ambiguous_procedure_group'
        from transaction_facts_private where procedure_relationship_state <> 'valid'
        union all
        select 'transaction', sha256(transaction_id), 'unmatched_community'
        from transaction_facts_private where community_relationship_state = 'unmatched'
        union all
        select 'transaction', sha256(transaction_id), 'unmatched_nonnull_project'
        from transaction_facts_private where project_number is not null and project_relationship_state = 'unmatched'
        union all
        select 'transaction', sha256(transaction_id), 'unmatched_developer_for_matched_project'
        from transaction_facts_private where project_relationship_state = 'matched' and developer_relationship_state = 'unmatched'
        union all
        select 'rent_contract', sha256(contract_id), contract_classification
        from rental_contract_facts_private where contract_classification <> 'eligible'
        union all
        select 'rent_contract', sha256(contract_id), 'inconsistent_repeated_contract_attributes'
        from rental_contract_facts_private where not header_consistent
        union all
        select 'rent_contract', sha256(contract_id), 'declared_property_count_mismatch'
        from rental_contract_facts_private where declared_property_count_mismatch
        union all
        select 'rent_line', sha256(contract_id || '|' || line_number), 'unmatched_nonnull_area'
        from rental_contract_lines_private
        where area_id is not null and community_relationship_state = 'unmatched'
        union all
        select 'rent_line', sha256(contract_id || '|' || line_number), 'unmatched_nonnull_project'
        from rental_contract_lines_private
        where project_number is not null and project_relationship_state = 'unmatched';

        create table data_quality_results as
        select 'transaction_economic_classification' check_name, economic_classification result, count(*) record_count
        from transaction_facts_private group by 1,2
        union all
        select 'transaction_procedure_relationship', procedure_relationship_state, count(*)
        from transaction_facts_private group by 1,2
        union all
        select 'transaction_community_relationship', community_relationship_state, count(*)
        from transaction_facts_private group by 1,2
        union all
        select 'transaction_project_relationship', project_relationship_state, count(*)
        from transaction_facts_private group by 1,2
        union all
        select 'transaction_developer_relationship', developer_relationship_state, count(*)
        from transaction_facts_private group by 1,2
        union all
        select 'rental_contract_classification', contract_classification, count(*)
        from rental_contract_facts_private group by 1,2
        union all
        select 'relationship_quarantine', issue, count(*)
        from relationship_quarantine_private group by 1,2;
        """
    )


def periodized_sql(scope: str, domain: str) -> str:
    permitted = {
        "month": "entity_type in ('dubai','community')",
        "quarter": "true",
        "year": "true",
    }
    parts = []
    for grain, column in (("month", "month_start"), ("quarter", "quarter_start"), ("year", "year_start")):
        if grain == "month":
            end = f"last_day({column})"
        elif grain == "quarter":
            end = f"({column} + interval '3 months' - interval '1 day')::date"
        else:
            end = f"({column} + interval '1 year' - interval '1 day')::date"
        parts.append(
            f"select '{domain}' data_domain, entity_type, entity_key, entity_name_en, entity_name_ar, "
            f"segment_type, segment_key, segment_name_en, segment_name_ar, '{grain}' period_type, "
            f"{column} period_start, {end} period_end, {end} < date '{SOURCE_EXPORT_DATE.isoformat()}' is_complete_period, "
            "record_value, unit_value, annual_amount "
            f"from {scope} where {column} is not null and {permitted[grain]}"
        )
    return " union all ".join(parts)


def create_aggregates(conn: duckdb.DuckDBPyConnection) -> None:
    conn.execute(
        """
        create temporary view sales_entities as
        select f.*, 'dubai' entity_type, 'dubai' entity_key, 'Dubai' entity_name_en, 'دبي' entity_name_ar
        from transaction_facts_private f where economic_classification = 'eligible_market_sale'
        union all
        select f.*, 'community', 'community:' || f.area_id,
          c.name_en, c.name_ar
        from transaction_facts_private f join dim_communities c using (area_id)
        where economic_classification = 'eligible_market_sale' and community_relationship_state = 'matched'
        union all
        select f.*, 'project', 'project:' || f.project_number,
          p.name_en, p.name_ar
        from transaction_facts_private f join dim_projects p using (project_number)
        where economic_classification = 'eligible_market_sale' and project_relationship_state = 'matched'
        union all
        select f.*, 'developer', 'developer:' || f.developer_id,
          d.name_en, d.name_ar
        from transaction_facts_private f join dim_developers d using (developer_id)
        where economic_classification = 'eligible_market_sale' and developer_relationship_state = 'matched';

        create temporary view sales_scoped as
        select *, 'all' segment_type, 'all' segment_key, 'All' segment_name_en, 'الكل' segment_name_ar,
          recorded_value record_value, recorded_value_per_sqm unit_value, cast(null as double) annual_amount
        from sales_entities
        union all
        select e.*, 'registration_type', 'registration:' || e.registration_type_id,
          r.name_en, r.name_ar, recorded_value, recorded_value_per_sqm, cast(null as double)
        from sales_entities e join dim_transaction_registration_types r using (registration_type_id)
        union all
        select e.*, 'property_class', 'property_subtype:' || e.property_subtype_id,
          s.name_en, s.name_ar, recorded_value, recorded_value_per_sqm, cast(null as double)
        from sales_entities e join dim_transaction_property_subtypes s using (property_subtype_id)
        where e.property_subtype_id in (4, 60);

        create temporary view rent_entities as
        select f.*, 'dubai' entity_type, 'dubai' entity_key, 'Dubai' entity_name_en, 'دبي' entity_name_ar
        from rental_contract_facts_private f where contract_classification = 'eligible'
        union all
        select f.*, 'community', 'community:' || f.safe_area_id, c.name_en, c.name_ar
        from rental_contract_facts_private f join dim_communities c on c.area_id = f.safe_area_id
        where contract_classification = 'eligible'
        union all
        select f.*, 'project', 'project:' || f.safe_project_number, p.name_en, p.name_ar
        from rental_contract_facts_private f join dim_projects p on p.project_number = f.safe_project_number
        where contract_classification = 'eligible';

        create temporary view rent_scoped as
        select *, 'all' segment_type, 'all' segment_key, 'All' segment_name_en, 'الكل' segment_name_ar,
          cast(null as double) record_value, cast(null as double) unit_value,
          case when amount_eligible then annual_amount end annual_amount
        from rent_entities
        union all
        select e.*, 'registration_type', 'registration:' || e.registration_type_id,
          r.name_en, r.name_ar, cast(null as double), cast(null as double),
          case when amount_eligible then annual_amount end
        from rent_entities e join dim_rent_registration_types r using (registration_type_id);
        """
    )
    sale_periodized = periodized_sql("sales_scoped", "sales")
    rent_periodized = periodized_sql("rent_scoped", "rent")
    conn.execute(
        f"""
        create table aggregate_cells_private as
        with periodized as ({sale_periodized} union all {rent_periodized})
        select data_domain, entity_type, entity_key, entity_name_en, entity_name_ar,
          segment_type, segment_key, segment_name_en, segment_name_ar,
          period_type, period_start, period_end, is_complete_period,
          count(*) observation_count,
          count(record_value) recorded_value_observations,
          sum(record_value) recorded_value_total,
          median(record_value) recorded_value_median,
          count(unit_value) unit_value_observations,
          median(unit_value) unit_value_median,
          count(annual_amount) annual_amount_observations,
          median(annual_amount) annual_amount_median
        from periodized group by all;

        create table aggregate_metrics_private as
        select *, data_domain || '_count' metric_name, observation_count metric_observations,
          observation_count::double metric_value, 'supported' publication_state
        from aggregate_cells_private
        union all
        select *, 'sale_recorded_total', recorded_value_observations, recorded_value_total,
          'blocked_transaction_currency_unresolved'
        from aggregate_cells_private where data_domain = 'sales' and entity_type <> 'developer'
        union all
        select *, 'sale_recorded_median', recorded_value_observations, recorded_value_median,
          'blocked_transaction_currency_unresolved'
        from aggregate_cells_private where data_domain = 'sales' and entity_type <> 'developer'
        union all
        select *, 'sale_recorded_unit_median', unit_value_observations, unit_value_median,
          'blocked_transaction_currency_unresolved'
        from aggregate_cells_private where data_domain = 'sales' and entity_type <> 'developer'
        union all
        select *, 'rent_annual_amount_median', annual_amount_observations, annual_amount_median,
          'supported_by_supplied_dld_dictionary'
        from aggregate_cells_private where data_domain = 'rent';

        create table public_aggregates_sanitized as
        with base as (
          select data_domain, entity_type, entity_key, entity_name_en, entity_name_ar,
            segment_type, segment_key, segment_name_en, segment_name_ar,
            period_type, period_start, period_end, metric_name, metric_value,
            metric_observations observation_count,
            case when metric_observations between 10 and 29 then 'insufficient_sample_for_value_statistics'
              when metric_observations between 30 and 99 then 'publishable'
              else 'publishable' end suppression_state,
            case when metric_observations between 10 and 29 then 'counts_only'
              when metric_observations between 30 and 99 then 'moderate'
              else 'higher' end confidence_state,
            case when is_complete_period then 'complete' else 'incomplete' end completeness_state,
            '[]' quality_flags, date '{SOURCE_EXPORT_DATE.isoformat()}' source_export_date,
            '{METHODOLOGY_VERSION}' methodology_version
          from aggregate_metrics_private
          where publication_state in ('supported','supported_by_supplied_dld_dictionary')
            and metric_observations >= 10
            and (metric_name like '%_count' or metric_observations >= 30)
        ), ordered as (
          select *, lag(metric_value) over w previous_value,
            lag(observation_count) over w previous_observation_count,
            lag(period_start) over w previous_period_start,
            lag(completeness_state) over w previous_completeness_state
          from base window w as (
            partition by data_domain, entity_type, entity_key, segment_type, segment_key, period_type, metric_name
            order by period_start
          )
        ), changes as (
          select data_domain, entity_type, entity_key, entity_name_en, entity_name_ar,
            segment_type, segment_key, segment_name_en, segment_name_ar,
            period_type, period_start, period_end, metric_name || '_period_change' metric_name,
            metric_value / previous_value - 1 metric_value,
            observation_count, 'publishable' suppression_state,
            case when least(observation_count, previous_observation_count) between 30 and 99 then 'moderate' else 'higher' end confidence_state,
            completeness_state, '[]' quality_flags, source_export_date, methodology_version
          from ordered
          where observation_count >= 30 and previous_observation_count >= 30
            and completeness_state = 'complete' and previous_completeness_state = 'complete'
            and previous_value is not null and previous_value <> 0
            and case period_type
              when 'month' then date_diff('month', previous_period_start, period_start) = 1
              when 'quarter' then date_diff('month', previous_period_start, period_start) = 3
              when 'year' then date_diff('year', previous_period_start, period_start) = 1
            end
        )
        select * from base union all select * from changes;
        """
    )


def create_metadata(conn: duckdb.DuckDBPyConnection, package_hash: str) -> None:
    conn.execute(
        f"""
        create table source_manifests_private(
          package_hash varchar primary key, source_export_date date, methodology_version varchar,
          source_dataset_count bigint, source_file_count bigint, source_row_count bigint
        );
        insert into source_manifests_private values
          ('{package_hash}', date '{SOURCE_EXPORT_DATE.isoformat()}', '{METHODOLOGY_VERSION}', 25, 62, 16521480);

        create table publication_runs_private(
          run_key varchar primary key, package_hash varchar, methodology_version varchar,
          source_export_date date, status varchar, is_remote boolean
        );
        insert into publication_runs_private values
          ('{package_hash}:{METHODOLOGY_VERSION}', '{package_hash}', '{METHODOLOGY_VERSION}',
           date '{SOURCE_EXPORT_DATE.isoformat()}', 'locally_verified', false);
        """
    )
    conn.execute(
        """
        create table source_files_private(
          dataset varchar, relative_path varchar, compressed_bytes bigint,
          sha256 varchar, source_export_date date
        );
        create table source_schema_fingerprints_private(
          dataset varchar, source_table varchar, schema_sha256 varchar
        );
        """
    )
    inventory = read_json(PHASE3A_REPORTS / "inventory.json")
    files = [
        (
            dataset["dataset"], item["path"], item["compressed_bytes"], item["sha256"],
            item["source_export_date"],
        )
        for dataset in inventory
        for item in dataset["files"]
    ]
    conn.executemany("insert into source_files_private values (?, ?, ?, ?, ?)", files)
    fingerprints = read_json(PHASE3A_REPORTS / "schema_fingerprints.json")
    conn.executemany(
        "insert into source_schema_fingerprints_private values (?, ?, ?)",
        [(item["dataset"], item["table"], item["sha256"]) for item in fingerprints],
    )


def table_storage(conn: duckdb.DuckDBPyConnection, table: str, block_size: int) -> dict[str, Any]:
    rows = rows_dict(conn, f"pragma storage_info('{table}')")
    blocks = {row["block_id"] for row in rows if isinstance(row["block_id"], int) and row["block_id"] >= 0}
    return {
        "table": table,
        "rows": scalar(conn, f'select count(*) from "{table}"'),
        "allocated_block_estimate_bytes": len(blocks) * block_size,
        "storage_segments": len(rows),
    }


def export_sanitized(
    conn: duckdb.DuckDBPyConnection, target: Path, reported_target: Path
) -> dict[str, Any]:
    target_sql = target.as_posix().replace("'", "''")
    conn.execute(
        f"""
        copy (
          select * from public_aggregates_sanitized
          order by data_domain, entity_type, entity_key, segment_type, segment_key,
            period_type, period_start, metric_name
        ) to '{target_sql}' (format json, array false)
        """
    )
    return {"path": str(reported_target), "rows": scalar(conn, "select count(*) from public_aggregates_sanitized"), "bytes": target.stat().st_size, "sha256": sha256_file(target)}


def build_reports(
    conn: duckdb.DuckDBPyConnection,
    reports: Path,
    output: Path,
    package_hash: str,
    elapsed_seconds: float,
    database_path: Path,
    transfer_building: Path,
    transfer_final: Path,
) -> None:
    reports.mkdir(parents=True, exist_ok=True)
    classifications = rows_dict(
        conn,
        "select economic_classification classification, count(*) record_count from transaction_facts_private group by 1 order by 1",
    )
    transaction_relationships = rows_dict(
        conn,
        """
        select 'procedure_group' relationship, procedure_relationship_state state, count(*) record_count
        from transaction_facts_private group by 1,2 union all
        select 'community', community_relationship_state, count(*) from transaction_facts_private group by 1,2 union all
        select 'project', project_relationship_state, count(*) from transaction_facts_private group by 1,2 union all
        select 'developer', developer_relationship_state, count(*) from transaction_facts_private group by 1,2
        order by 1,2
        """,
    )
    rent = rows_dict(
        conn,
        "select contract_classification classification, count(*) contracts, sum(line_count) source_lines from rental_contract_facts_private group by 1 order by 1",
    )
    rent_quality = row_dict(
        conn,
        """
        select count(*) contracts, sum(line_count) lines,
          count(*) filter (where contract_classification='eligible') eligible_contracts,
          sum(line_count) filter (where contract_classification='eligible') lines_in_eligible_contracts,
          count(*) filter (where safe_area_id is not null and contract_classification='eligible') eligible_single_safe_area_contracts,
          count(*) filter (where safe_project_number is not null and contract_classification='eligible') eligible_single_safe_project_contracts,
          count(*) filter (where line_count > 1 and contract_classification='eligible') eligible_multiline_contracts,
          count(*) filter (where distinct_area_ids > 1) mixed_area_contracts,
          count(*) filter (where distinct_project_numbers > 1) mixed_project_contracts,
          count(*) filter (where unresolved_area_lines > 0) contracts_with_unresolved_area_lines,
          count(*) filter (where unresolved_project_lines > 0) contracts_with_unresolved_project_lines,
          count(*) filter (where not header_consistent) inconsistent_header_contracts,
          count(*) filter (where declared_property_count_mismatch) declared_property_count_mismatches
        from rental_contract_facts_private
        """,
    )
    quarantine = rows_dict(conn, "select source_kind, issue, count(*) record_count from relationship_quarantine_private group by 1,2 order by 1,2")
    aggregate_summary = rows_dict(
        conn,
        """
        select data_domain, entity_type, period_type, metric_name, completeness_state,
          count(*) public_rows, sum(observation_count) summed_observation_counts
        from public_aggregates_sanitized group by all order by 1,2,3,4,5
        """,
    )
    suppression = rows_dict(
        conn,
        """
        select data_domain, metric_name,
          count(*) filter (where metric_observations < 10) private_cells_below_10_omitted,
          count(*) filter (where metric_observations between 10 and 29) private_cells_10_to_29,
          count(*) filter (where metric_observations >= 30) private_cells_30_plus,
          count(*) filter (where publication_state like 'blocked%') blocked_cells
        from aggregate_metrics_private group by 1,2 order by 1,2
        """,
    )
    samples = rows_dict(
        conn,
        """
        select * from public_aggregates_sanitized
        where entity_type in ('dubai','community') and completeness_state='complete'
        qualify row_number() over (partition by data_domain, entity_type, metric_name order by period_start desc, entity_key) <= 3
        order by data_domain, entity_type, metric_name, period_start desc, entity_key
        """,
    )
    transfer = export_sanitized(conn, transfer_building, transfer_final)
    db_size_row = row_dict(conn, "pragma database_size")
    raw_block_size = db_size_row["block_size"]
    if isinstance(raw_block_size, int):
        block_size = raw_block_size
    elif "KiB" in raw_block_size:
        block_size = int(raw_block_size.split()[0]) * 1024
    else:
        block_size = 262144
    tables = [
        "transaction_facts_private", "rental_contract_facts_private", "rental_contract_lines_private",
        "relationship_quarantine_private", "aggregate_cells_private", "aggregate_metrics_private",
        "public_aggregates_sanitized", "residential_sale_index_private",
    ]
    storage = [table_storage(conn, table, block_size) for table in tables]
    latencies = []
    for name, sql in (
        ("dubai_latest_complete_month", "select * from public_aggregates_sanitized where entity_key='dubai' and period_type='month' and completeness_state='complete' order by period_start desc limit 50"),
        ("community_series", "select * from public_aggregates_sanitized where entity_type='community' and metric_name='sales_count' order by period_start desc limit 100"),
        ("project_series", "select * from public_aggregates_sanitized where entity_type='project' and metric_name='sales_count' order by period_start desc limit 100"),
    ):
        started = time.perf_counter()
        conn.execute(sql).fetchall()
        latencies.append({"query": name, "milliseconds": round((time.perf_counter() - started) * 1000, 3)})

    write_json(
        reports / "metadata.json",
        {
            "schema_version": 1,
            "methodology_version": METHODOLOGY_VERSION,
            "source_export_date": SOURCE_EXPORT_DATE,
            "source_package_hash": package_hash,
            "source_rows": 16_521_480,
            "database_opened_from_phase0_read_only": True,
            "remote_connections": 0,
            "transaction_currency_status": "unresolved",
            "rental_actual_area_unit_status": "unresolved",
        },
    )
    write_json(
        reports / "authoritative_metadata.json",
        {
            "access_date": RESEARCH_ACCESS_DATE,
            "supplied_dld_dictionary": [
                {"field": "transactions.procedure_area", "interpretation": "square metres", "status": "supported"},
                {"field": "transactions.actual_worth", "interpretation": "property price; currency not declared", "status": "currency unresolved"},
                {"field": "rent.contract_amount", "interpretation": "contract amount in AED", "status": "supported"},
                {"field": "rent.annual_amount", "interpretation": "calculated annual amount for a non-12-month contract; derived from the AED contract amount", "status": "supported for annual-rent medians"},
                {"field": "rent.actual_area", "interpretation": "property current area; unit not declared", "status": "unit unresolved"},
                {"field": "transaction registration type", "interpretation": "existing or off-plan", "status": "supported"},
            ],
            "official_sources": [
                {"url": "https://www.gslb.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open-api", "supports": "transaction field meanings and procedure_area in square metres; does not state actual_worth currency"},
                {"url": "https://dubailand.gov.ae/en/open-data/real-estate-data/", "supports": "official transaction export field labels and transaction size in square metres; amount currency remains unstated on the field contract"},
                {"url": INDEX_SOURCE_URL, "supports": "official separate Residential Sale Index, hedonic methodology, monthly/quarterly/yearly series and usage disclaimer"},
                {"url": INDEX_METHODOLOGY_URL, "supports": "hedonic imputation methodology and residential category coverage"},
            ],
        },
    )
    write_json(reports / "transaction_classification.json", {"total": sum(row["record_count"] for row in classifications), "classifications": classifications})
    write_json(reports / "relationship_quality.json", {"transactions": transaction_relationships, "quarantine": quarantine})
    write_json(reports / "rental_reconciliation.json", {"classifications": rent, "quality": rent_quality})
    write_json(reports / "aggregate_summary.json", aggregate_summary)
    write_json(reports / "suppression_summary.json", suppression)
    write_json(reports / "sanitized_samples.json", samples)
    write_json(
        reports / "schemas.json",
        {table: rows_dict(conn, f'describe "{table}"') for table in tables},
    )
    write_json(
        reports / "residential_index.json",
        {
            "private_rows": scalar(conn, "select count(*) from residential_sale_index_private"),
            "source_period_min": scalar(conn, "select min(source_period) from residential_sale_index_private"),
            "source_period_max": scalar(conn, "select max(source_period) from residential_sale_index_private"),
            "categories": ["all", "flat", "villa"],
            "period_types": ["monthly", "quarterly", "yearly"],
            "source_url": INDEX_SOURCE_URL,
            "methodology_url": INDEX_METHODOLOGY_URL,
            "publication_state": "separate; excluded from commercial transfer pending legal/methodology review",
        },
    )
    write_json(
        reports / "transfer_contract.json",
        {
            "status": "proposed local sanitized artifact; not uploaded",
            "artifact": transfer,
            "columns": [row["column_name"] for row in rows_dict(conn, "describe public_aggregates_sanitized")],
            "exclusions": ["cells below 10", "sale currency-dependent metrics", "rent unit-price metrics", "gross yield", "primary/secondary classification", "raw facts and internal identifiers", "Residential Sale Index"],
            "future_portable_package": "Split the sorted JSONL into deterministic chunks of at most 4 MB, hash each chunk, and bind counts/schema/methodology to a signed manifest before any separately approved transfer.",
        },
    )
    write_json(
        reports / "deployment_architecture.json",
        {
            "recommendation": "C: local/offline private facts with a publication package containing sanitized aggregates only",
            "reason": "Minimizes privacy exposure, Supabase storage and public attack surface while preserving deterministic rebuilds from immutable source snapshots.",
            "options": {
                "A": "Not recommended initially: largest remote private-data footprint and operational/RLS burden.",
                "B": "Viable later for managed recurring processing, but requires secure object-storage governance and compute orchestration.",
                "C": "Recommended now: private facts remain offline; only verified aggregate rows cross the boundary after approval.",
            },
        },
    )
    write_json(
        reports / "migration_proposal.json",
        {
            "status": "documentation only; no SQL migration created",
            "future_additive_objects": ["dld_market_import_runs", "dld_market_aggregate_stage", "dld_market_aggregates", "publish_dld_market_aggregates"],
            "requirements": ["manifest hash and methodology uniqueness", "exact schema/count/hash validation", "server-side prohibited metric validation", "atomic stage-to-publish transaction", "RLS-denied staging and public read view", "rollback to prior immutable run"],
        },
    )
    write_json(
        reports / "storage_performance.json",
        {
            "full_rebuild_seconds": round(elapsed_seconds, 3),
            "replacement_rebuild_estimate_seconds": round(elapsed_seconds, 3),
            "incremental_append": "not supported because source files are complete replacement snapshots",
            "database_file_bytes": database_path.stat().st_size if database_path.exists() else None,
            "database_reported_size": db_size_row,
            "peak_process_working_set_bytes": peak_working_set_bytes(),
            "table_storage": storage,
            "query_latency": latencies,
        },
    )


def deterministic_manifest(reports: Path) -> dict[str, Any]:
    excluded = {"manifest.json", "verification.json", "storage_performance.json"}
    files = []
    for path in sorted(reports.iterdir()):
        if path.is_file() and path.name not in excluded:
            files.append({"file": path.name, "bytes": path.stat().st_size, "sha256": sha256_file(path)})
    return {"schema_version": 1, "methodology_version": METHODOLOGY_VERSION, "files": files}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-db", type=Path, default=PHASE0_DB)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--reports", type=Path, default=DEFAULT_REPORTS)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    source_db = args.source_db.resolve()
    output = args.output.resolve()
    reports = args.reports.resolve()
    output.mkdir(parents=True, exist_ok=True)
    database = output / "phase3b.duckdb"
    transfer = output / "sanitized_public_aggregates.jsonl"
    transfer_building = output / "sanitized-public-building.jsonl"
    package_hash = source_package_hash()

    if database.exists() and not args.force:
        check = duckdb.connect(str(database), read_only=True)
        existing = check.execute("select package_hash, methodology_version from source_manifests_private").fetchone()
        check.close()
        if existing == (package_hash, METHODOLOGY_VERSION) and transfer.exists():
            print(json.dumps({"status": "idempotent_noop", "package_hash": package_hash, "database": str(database)}, indent=2))
            return 0
        raise SystemExit("Existing Phase 3B database does not match; use --force for an explicit replacement rebuild")

    temporary = output / "phase3b-building.duckdb"
    if temporary.exists():
        temporary.unlink()
    if transfer_building.exists():
        transfer_building.unlink()
    started = time.perf_counter()
    conn = duckdb.connect(str(temporary))
    conn.execute("set threads=1")
    conn.execute("set preserve_insertion_order=false")
    conn.execute("set memory_limit='4GB'")
    temp_spill = (output / "spill").as_posix().replace("'", "''")
    conn.execute(f"set temp_directory='{temp_spill}'")
    source_sql = source_db.as_posix().replace("'", "''")
    conn.execute(f"attach '{source_sql}' as src (read_only)")
    create_metadata(conn, package_hash)
    create_dimensions(conn)
    create_transaction_facts(conn)
    create_rental_facts(conn)
    create_index_facts(conn)
    create_quarantine_and_quality(conn)
    create_aggregates(conn)
    conn.execute("checkpoint")
    elapsed = time.perf_counter() - started
    build_reports(conn, reports, output, package_hash, elapsed, temporary, transfer_building, transfer)
    write_json(reports / "manifest.json", deterministic_manifest(reports))
    conn.close()
    os.replace(temporary, database)
    os.replace(transfer_building, transfer)
    # Refresh the measured final file size without changing deterministic reports.
    performance = read_json(reports / "storage_performance.json")
    performance["database_file_bytes"] = database.stat().st_size
    write_json(reports / "storage_performance.json", performance)
    print(json.dumps({"status": "rebuilt", "package_hash": package_hash, "database": str(database), "seconds": round(elapsed, 3)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
