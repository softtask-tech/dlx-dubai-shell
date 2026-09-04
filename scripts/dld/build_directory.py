#!/usr/bin/env python3
"""Build deterministic, sanitized DLD Phase 1A directory marts from Phase 0 DuckDB."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

import duckdb
from duckdb.sqltypes import VARCHAR


SOURCE_TABLES = {
    "communities": ("areas", "Lookup Dubai Community Areas"),
    "developers": ("developers", "Developers Recorded in Dubai Land Department"),
    "projects": ("projects", "Real Estate Projects"),
    "brokers": ("brokers", "Real Estate Brokers"),
    "offices": ("offices", "Real Estate Offices"),
    "licences": ("licences", "Real Estate Licenses"),
    "permits": ("permits", "Real Estate Permits"),
    "valuators": ("valuators", "Licensed Real Estate Valuators"),
    "escrow_agents": ("escrow_agents", "Approved Escrow Account Agents"),
    "owner_associations": ("owner_associations", "Licenced Owner Associations"),
    "free_zone_companies": ("free_zone_companies", "Free Zone Companies Licensing"),
}

OUTPUT_ENTITIES = [
    "communities", "developers", "projects", "brokers", "broker_office_links", "offices",
    "office_activities", "licences", "permits", "valuators", "escrow_agents",
    "owner_associations", "free_zone_companies", "search_index",
]

PUBLIC_SEARCH_TYPES = {
    "community", "developer", "project", "broker", "office", "licence",
    "permit", "valuator", "escrow_agent", "owner_association", "free_zone_company",
}

NON_AFFILIATION = "Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied."
CONTACT_FIELDS = {"phone", "email", "fax", "webpage"}
FORBIDDEN_PUBLIC_FIELDS = CONTACT_FIELDS | {
    "gender", "gender_id", "gender_en", "gender_ar", "valuator_nationality_id",
    "valuator_nationality_en", "valuator_nationality_ar", "parcel_id", "rent_contract_no",
    "location", "load_timestamp",
}


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(rows[0]) if rows else []
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_alias(value: str | None) -> str | None:
    if value is None:
        return None
    text = unicodedata.normalize("NFKC", str(value)).strip().casefold()
    if not text:
        return None
    for mark in "ًٌٍَُِّْـ":
        text = text.replace(mark, "")
    text = text.translate(str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ؤ": "و", "ئ": "ي"}))
    text = re.sub(r"[^\w\u0600-\u06ff]+", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def alias_pack(a: str | None, b: str | None, c: str | None, d: str | None, e: str | None, f: str | None) -> str:
    values: list[str] = []
    for value in (a, b, c, d, e, f):
        normalized = normalize_alias(value)
        if normalized and normalized not in values:
            values.append(normalized)
        if normalized:
            compact = normalized.replace(" ", "")
            if compact and compact != normalized and compact not in values:
                values.append(compact)
    return "|".join(values)


def english_name(value: str | None) -> str | None:
    if value is None:
        return None
    return None if re.search(r"[\u0600-\u06ff]", value) else value.strip() or None


def arabic_name(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None if re.search(r"[\u0600-\u06ff]", value) else None


def norm_id(column: str) -> str:
    return f"regexp_replace(trim({column}), '\\.0+$', '')"


def source_export_date(conn: duckdb.DuckDBPyConnection, table: str) -> str:
    filenames = [row[0] for row in conn.execute(f"SELECT DISTINCT _source_file FROM {table}").fetchall()]
    dates = []
    for filename in filenames:
        match = re.search(r"(20\d{2}-\d{2}-\d{2})", Path(filename).name)
        if not match:
            raise ValueError(f"No export date in {filename}")
        dates.append(match.group(1))
    return max(dates)


def register_functions(conn: duckdb.DuckDBPyConnection) -> None:
    conn.create_function("dir_aliases", alias_pack, [VARCHAR] * 6, VARCHAR, null_handling="special")
    conn.create_function("dir_name_en", english_name, [VARCHAR], VARCHAR, null_handling="special")
    conn.create_function("dir_name_ar", arabic_name, [VARCHAR], VARCHAR, null_handling="special")
    conn.create_function("dir_normalize", normalize_alias, [VARCHAR], VARCHAR, null_handling="special")


def sql_views(conn: duckdb.DuckDBPyConnection, dates: dict[str, str]) -> dict[str, str]:
    view_sql: dict[str, str] = {}
    view_sql["communities"] = f"""
      SELECT {norm_id('area_id')} AS area_id, trim(municipality_number) AS municipality_number,
             trim(name_en) AS name_en, trim(name_ar) AS name_ar,
             dir_aliases(name_en,name_ar,area_id,municipality_number,NULL,NULL) AS aliases,
             DATE '{dates['communities']}' AS source_export_date,
             'Lookup Dubai Community Areas' AS source_dataset
      FROM areas
    """
    view_sql["developers"] = f"""
      SELECT {norm_id('developer_id')} AS developer_id, {norm_id('participant_id')} AS participant_id,
             {norm_id('developer_number')} AS developer_number,
             trim(developer_name_en) AS name_en, trim(developer_name_ar) AS name_ar,
             try_cast(registration_date AS DATE) AS registration_date,
             trim(license_number) AS licence_number,
             {norm_id('license_source_id')} AS licence_source_id,
             trim(license_source_en) AS licence_source_en, trim(license_source_ar) AS licence_source_ar,
             try_cast(license_issue_date AS DATE) AS licence_issue_date,
             try_cast(license_expiry_date AS DATE) AS licence_expiry_date,
             trim(legal_status_en) AS legal_status_en, trim(legal_status_ar) AS legal_status_ar,
             dir_aliases(developer_name_en,developer_name_ar,developer_number,license_number,NULL,NULL) AS aliases,
             DATE '{dates['developers']}' AS source_export_date,
             'Developers Recorded in Dubai Land Department' AS source_dataset
      FROM developers
    """
    view_sql["projects"] = f"""
      SELECT {norm_id('project_id')} AS project_id, {norm_id('project_number')} AS project_number,
             trim(project_name) AS source_name,
             dir_name_en(project_name) AS name_en, dir_name_ar(project_name) AS name_ar,
             {norm_id('developer_id')} AS source_developer_id,
             CASE WHEN {norm_id('developer_id')} IN (SELECT {norm_id('developer_id')} FROM developers)
                  THEN {norm_id('developer_id')} END AS developer_id,
             {norm_id('developer_number')} AS developer_number,
             trim(developer_name) AS source_developer_name,
             {norm_id('master_developer_id')} AS master_developer_id,
             {norm_id('area_id')} AS area_id, trim(area_name_en) AS area_name_en, trim(area_name_ar) AS area_name_ar,
             {norm_id('escrow_agent_id')} AS source_escrow_agent_number,
             CASE WHEN {norm_id('escrow_agent_id')} IN (SELECT {norm_id('escrow_agent_number')} FROM escrow_agents)
                  THEN {norm_id('escrow_agent_id')} END AS escrow_agent_number,
             trim(project_status) AS status_en, trim(project_status_ar) AS status_ar,
             try_cast(percent_completed AS DOUBLE) AS percent_completed,
             try_cast(project_start_date AS DATE) AS project_start_date,
             try_cast(project_end_date AS DATE) AS project_end_date,
             try_cast(completion_date AS DATE) AS completion_date,
             try_cast(cancellation_date AS DATE) AS cancellation_date,
             try_cast(no_of_units AS BIGINT) AS no_of_units,
             try_cast(no_of_villas AS BIGINT) AS no_of_villas,
             try_cast(no_of_buildings AS BIGINT) AS no_of_buildings,
             dir_aliases(project_name,project_number,area_name_en,area_name_ar,developer_name,NULL) AS aliases,
             DATE '{dates['projects']}' AS source_export_date,
             'Real Estate Projects' AS source_dataset
      FROM projects
    """
    view_sql["brokers"] = f"""
      SELECT {norm_id('real_estate_broker_id')} AS broker_id,
             mode({norm_id('participant_id')}) AS participant_id,
             mode({norm_id('broker_number')}) AS broker_number,
             mode(trim(broker_name_en)) AS name_en, mode(trim(broker_name_ar)) AS name_ar,
             min(try_cast(license_start_date AS DATE)) AS licence_start_date,
             max(try_cast(license_end_date AS DATE)) AS licence_end_date,
             dir_aliases(mode(broker_name_en),mode(broker_name_ar),mode(broker_number),NULL,NULL,NULL) AS aliases,
             DATE '{dates['brokers']}' AS source_export_date,
             'Real Estate Brokers' AS source_dataset
      FROM brokers
      GROUP BY real_estate_broker_id
    """
    view_sql["broker_office_links"] = f"""
      SELECT {norm_id('real_estate_broker_id')} AS broker_id,
             {norm_id('real_estate_id')} AS source_office_id,
             CASE WHEN {norm_id('real_estate_id')} IN (SELECT {norm_id('real_estate_id')} FROM offices)
                  THEN {norm_id('real_estate_id')} END AS office_id,
             {norm_id('real_estate_number')} AS office_number,
             try_cast(license_start_date AS DATE) AS licence_start_date,
             try_cast(license_end_date AS DATE) AS licence_end_date,
             DATE '{dates['brokers']}' AS source_export_date,
             'Real Estate Brokers' AS source_dataset
      FROM brokers
    """
    view_sql["offices"] = f"""
      WITH licence_names AS (
        SELECT {norm_id('participant_id')} participant_id,
               mode(trade_name_english) name_en, mode(trade_name_arabic) name_ar
        FROM licences GROUP BY 1
      )
      SELECT {norm_id('o.real_estate_id')} AS office_id, {norm_id('o.real_estate_number')} AS office_number,
             {norm_id('o.participant_id')} AS participant_id,
             mode(trim(l.name_en)) AS name_en, mode(trim(l.name_ar)) AS name_ar,
             mode(trim(o.license_number)) AS licence_number,
             mode({norm_id('o.license_source_id')}) AS licence_source_id,
             mode(trim(o.license_source_en)) AS licence_source_en,
             mode(trim(o.license_source_ar)) AS licence_source_ar,
             min(try_cast(o.license_issue_date AS DATE)) AS licence_issue_date,
             max(try_cast(o.license_expiry_date AS DATE)) AS licence_expiry_date,
             bool_or(lower(trim(o.is_branch)) IN ('1','true','yes')) AS is_branch,
             mode({norm_id('o.main_office_id')}) AS main_office_id,
             dir_aliases(mode(l.name_en),mode(l.name_ar),o.real_estate_number,mode(o.license_number),o.real_estate_id,NULL) AS aliases,
             DATE '{dates['offices']}' AS source_export_date,
             'Real Estate Offices' AS source_dataset
      FROM offices o LEFT JOIN licence_names l ON l.participant_id = {norm_id('o.participant_id')}
      GROUP BY o.real_estate_id,o.real_estate_number,o.participant_id
    """
    view_sql["office_activities"] = f"""
      SELECT {norm_id('real_estate_id')} || ':' || coalesce(nullif({norm_id('activity_type_id')}, ''), '__unknown__') AS activity_key,
             {norm_id('real_estate_id')} AS office_id, {norm_id('activity_type_id')} AS activity_type_id,
             trim(activity_type_en) AS activity_name_en, trim(activity_type_ar) AS activity_name_ar,
             trim(ded_activity_code) AS ded_activity_code,
             DATE '{dates['offices']}' AS source_export_date,
             'Real Estate Offices' AS source_dataset
      FROM offices
    """
    view_sql["licences"] = f"""
      WITH office_participants AS (
        SELECT {norm_id('participant_id')} participant_id, min({norm_id('real_estate_id')}) office_id
        FROM offices GROUP BY 1 HAVING count(DISTINCT {norm_id('real_estate_id')}) = 1
      ), developer_participants AS (
        SELECT {norm_id('participant_id')} participant_id, min({norm_id('developer_id')}) developer_id
        FROM developers GROUP BY 1 HAVING count(DISTINCT {norm_id('developer_id')}) = 1
      )
      SELECT sha256({norm_id('l.participant_id')} || ':' || {norm_id('l.activity_type_id')}) AS licence_key,
             {norm_id('l.participant_id')} AS participant_id, {norm_id('l.activity_type_id')} AS activity_type_id,
             trim(l.activity_name_en) AS activity_name_en, trim(l.activity_name_ar) AS activity_name_ar,
             trim(l.license_number) AS licence_number,
             trim(l.trade_name_english) AS trade_name_en, trim(l.trade_name_arabic) AS trade_name_ar,
             trim(l.status_english) AS status_en, trim(l.status_arabic) AS status_ar,
             try_cast(l.issue_date AS DATE) AS issue_date, try_cast(l.expiry_date AS DATE) AS expiry_date,
             try_cast(l.cancel_date AS DATE) AS cancel_date,
             trim(l.legal_type_english) AS legal_type_en, trim(l.legal_type_arabic) AS legal_type_ar,
             trim(l.ded_activity_code) AS ded_activity_code, {norm_id('l.authority_id')} AS authority_id,
             o.office_id AS matched_office_id, d.developer_id AS matched_developer_id,
             dir_aliases(l.trade_name_english,l.trade_name_arabic,l.license_number,l.activity_name_en,l.activity_name_ar,NULL) AS aliases,
             DATE '{dates['licences']}' AS source_export_date,
             'Real Estate Licenses' AS source_dataset
      FROM licences l
      LEFT JOIN office_participants o ON o.participant_id = {norm_id('l.participant_id')}
      LEFT JOIN developer_participants d ON d.participant_id = {norm_id('l.participant_id')}
    """
    view_sql["permits"] = f"""
      SELECT {norm_id('permits_id')} AS permit_id, trim(permit_number) AS permit_number,
             trim(license_number) AS licence_number,
             trim(paricipant_name_en) AS participant_name_en, trim(participant_name_ar) AS participant_name_ar,
             {norm_id('service_id')} AS service_id, trim(service_en) AS service_en, trim(service_ar) AS service_ar,
             trim(main_service_en) AS main_service_en, trim(main_service_ar) AS main_service_ar,
             trim(permit_status_en) AS status_en, trim(permit_status_ar) AS status_ar,
             try_cast(start_date AS DATE) AS start_date, try_cast(end_date AS DATE) AS end_date,
             trim(exhibition_name_en) AS exhibition_name_en, trim(exhibition_name_ar) AS exhibition_name_ar,
             dir_aliases(paricipant_name_en,participant_name_ar,permit_number,license_number,service_en,service_ar) AS aliases,
             DATE '{dates['permits']}' AS source_export_date,
             'Real Estate Permits' AS source_dataset
      FROM permits
    """
    view_sql["valuators"] = f"""
      SELECT {norm_id('valuator_number')} || ':' || {norm_id('valuation_company_number')} AS valuator_key,
             {norm_id('valuator_number')} AS valuator_number,
             trim(valuator_name_en) AS name_en, trim(valuator_name_ar) AS name_ar,
             {norm_id('valuation_company_number')} AS valuation_company_number,
             trim(valuation_company_name_en) AS company_name_en, trim(valuation_company_name_ar) AS company_name_ar,
             try_cast(license_start_date AS DATE) AS licence_start_date,
             try_cast(license_end_date AS DATE) AS licence_end_date,
             dir_aliases(valuator_name_en,valuator_name_ar,valuator_number,valuation_company_number,valuation_company_name_en,valuation_company_name_ar) AS aliases,
             DATE '{dates['valuators']}' AS source_export_date,
             'Licensed Real Estate Valuators' AS source_dataset
      FROM valuators
    """
    view_sql["escrow_agents"] = f"""
      SELECT {norm_id('escrow_agent_number')} AS escrow_agent_number,
             trim(escrow_agent_name_en) AS name_en, trim(escrow_agent_name_ar) AS name_ar,
             dir_aliases(escrow_agent_name_en,escrow_agent_name_ar,escrow_agent_number,NULL,NULL,NULL) AS aliases,
             DATE '{dates['escrow_agents']}' AS source_export_date,
             'Approved Escrow Account Agents' AS source_dataset
      FROM escrow_agents
    """
    view_sql["owner_associations"] = f"""
      SELECT sha256(lower(trim(company_name_en)) || '|' || lower(trim(company_name_ar))) AS association_key,
             trim(company_name_en) AS name_en, trim(company_name_ar) AS name_ar,
             try_cast(latitude AS DOUBLE) AS latitude, try_cast(longitude AS DOUBLE) AS longitude,
             dir_aliases(company_name_en,company_name_ar,NULL,NULL,NULL,NULL) AS aliases,
             DATE '{dates['owner_associations']}' AS source_export_date,
             'Licenced Owner Associations' AS source_dataset
      FROM owner_associations
    """
    view_sql["free_zone_companies"] = f"""
      SELECT trim(fz_company_number) AS company_number,
             trim(fz_company_name_en) AS name_en, trim(fz_company_name_ar) AS name_ar,
             trim(license_number) AS licence_number,
             {norm_id('license_source_id')} AS licence_source_id,
             trim(license_source_en) AS licence_source_en, trim(license_source_ar) AS licence_source_ar,
             try_cast(license_issue_date AS DATE) AS licence_issue_date,
             try_cast(license_expiry_date AS DATE) AS licence_expiry_date,
             dir_aliases(fz_company_name_en,fz_company_name_ar,fz_company_number,license_number,license_source_en,license_source_ar) AS aliases,
             DATE '{dates['free_zone_companies']}' AS source_export_date,
             'Free Zone Companies Licensing' AS source_dataset
      FROM free_zone_companies
    """
    return view_sql


def create_search_view(conn: duckdb.DuckDBPyConnection) -> None:
    unions = [
        "SELECT 'community' entity_type, area_id source_key, name_en display_name_en, name_ar display_name_ar, area_id primary_number, municipality_number secondary_number, NULL status_en, aliases, source_export_date, source_dataset FROM dir_communities",
        "SELECT 'developer', developer_id, name_en, name_ar, developer_number, licence_number, legal_status_en, aliases, source_export_date, source_dataset FROM dir_developers",
        "SELECT 'project', project_id, name_en, name_ar, project_number, developer_number, status_en, aliases, source_export_date, source_dataset FROM dir_projects",
        "SELECT 'broker', broker_id, name_en, name_ar, broker_number, NULL, NULL, aliases, source_export_date, source_dataset FROM dir_brokers",
        "SELECT 'office', office_id, name_en, name_ar, office_number, licence_number, NULL, aliases, source_export_date, source_dataset FROM dir_offices",
        "SELECT 'licence', licence_key, trade_name_en, trade_name_ar, licence_number, NULL, status_en, aliases, source_export_date, source_dataset FROM dir_licences",
        "SELECT 'permit', permit_id, participant_name_en, participant_name_ar, permit_number, licence_number, status_en, aliases, source_export_date, source_dataset FROM dir_permits",
        "SELECT 'valuator', valuator_key, name_en, name_ar, valuator_number, valuation_company_number, NULL, aliases, source_export_date, source_dataset FROM dir_valuators",
        "SELECT 'escrow_agent', escrow_agent_number, name_en, name_ar, escrow_agent_number, NULL, NULL, aliases, source_export_date, source_dataset FROM dir_escrow_agents",
        "SELECT 'owner_association', association_key, name_en, name_ar, NULL, NULL, NULL, aliases, source_export_date, source_dataset FROM dir_owner_associations",
        "SELECT 'free_zone_company', company_number, name_en, name_ar, company_number, licence_number, NULL, aliases, source_export_date, source_dataset FROM dir_free_zone_companies",
    ]
    conn.execute("CREATE OR REPLACE TEMP TABLE dir_search_index AS " + " UNION ALL ".join(unions))


def parquet_manifest(output: Path) -> list[dict[str, Any]]:
    return [
        {"file": path.name, "bytes": path.stat().st_size, "sha256": sha256_file(path)}
        for path in sorted(output.glob("*.parquet"))
    ]


def query_dicts(conn: duckdb.DuckDBPyConnection, sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
    cursor = conn.execute(sql, params or [])
    names = [item[0] for item in cursor.description]
    return [dict(zip(names, row)) for row in cursor.fetchall()]


def relationships(conn: duckdb.DuckDBPyConnection) -> list[dict[str, Any]]:
    specs = [
        ("projects.source_developer_id -> developers.developer_id", "dir_projects", "source_developer_id", "dir_developers", "developer_id"),
        ("projects.area_id -> communities.area_id", "dir_projects", "area_id", "dir_communities", "area_id"),
        ("projects.source_escrow_agent_number -> escrow_agents.escrow_agent_number", "dir_projects", "source_escrow_agent_number", "dir_escrow_agents", "escrow_agent_number"),
        ("broker_office_links.source_office_id -> offices.office_id", "dir_broker_office_links", "source_office_id", "dir_offices", "office_id"),
        ("offices.participant_id -> licences.participant_id", "dir_offices", "participant_id", "dir_licences", "participant_id"),
        ("developers.participant_id -> licences.participant_id", "dir_developers", "participant_id", "dir_licences", "participant_id"),
    ]
    rows = []
    for name, child, child_field, parent, parent_field in specs:
        result = conn.execute(f"""
          WITH p AS (SELECT DISTINCT {parent_field} AS rel_key FROM {parent} WHERE nullif(trim({parent_field}),'') IS NOT NULL),
               c AS (SELECT {child_field} AS rel_key FROM {child} WHERE nullif(trim({child_field}),'') IS NOT NULL)
          SELECT count(*), count(DISTINCT c.rel_key),
                 count(*) FILTER (WHERE p.rel_key IS NOT NULL),
                 count(DISTINCT c.rel_key) FILTER (WHERE p.rel_key IS NOT NULL),
                 count(*) FILTER (WHERE p.rel_key IS NULL),
                 count(DISTINCT c.rel_key) FILTER (WHERE p.rel_key IS NULL)
          FROM c LEFT JOIN p USING(rel_key)
        """).fetchone()
        child_rows, child_keys, matched_rows, matched_keys, orphan_rows, orphan_keys = result
        total = conn.execute(f"SELECT count(*) FROM {child}").fetchone()[0]
        rows.append({
            "relationship": name,
            "child_total_rows": total,
            "child_non_null_rows": child_rows,
            "child_null_rows": total - child_rows,
            "child_distinct_keys": child_keys,
            "matched_rows": matched_rows,
            "matched_distinct_keys": matched_keys,
            "orphan_rows": orphan_rows,
            "orphan_distinct_keys": orphan_keys,
            "row_match_percent": round(100 * matched_rows / child_rows, 6) if child_rows else 100.0,
            "key_match_percent": round(100 * matched_keys / child_keys, 6) if child_keys else 100.0,
        })
    return rows


def schema_contract(conn: duckdb.DuckDBPyConnection) -> list[dict[str, Any]]:
    public_internal = {
        "participant_id": "internal", "source_developer_id": "internal-link", "source_office_id": "internal-link",
        "source_escrow_agent_number": "internal-link", "developer_id": "internal-link", "office_id": "internal-link",
        "master_developer_id": "internal-link", "matched_office_id": "internal-link",
        "matched_developer_id": "internal-link", "aliases": "search-internal",
    }
    rows = []
    for entity in OUTPUT_ENTITIES[:-1]:
        for ordinal, row in enumerate(conn.execute(f"DESCRIBE dir_{entity}").fetchall(), start=1):
            field = row[0]
            visibility = public_internal.get(field, "public")
            rows.append({"table": f"dld_directory_{entity}", "ordinal": ordinal, "field": field, "duckdb_type": row[1], "visibility": visibility})
    return rows


def search_tests(conn: duckdb.DuckDBPyConnection) -> list[dict[str, Any]]:
    probes = [
        ("english developer", "developer", "SELECT name_en FROM dir_developers WHERE name_en IS NOT NULL LIMIT 1"),
        ("arabic developer", "developer", "SELECT name_ar FROM dir_developers WHERE name_ar IS NOT NULL LIMIT 1"),
        ("english broker", "broker", "SELECT name_en FROM dir_brokers WHERE name_en IS NOT NULL LIMIT 1"),
        ("arabic broker", "broker", "SELECT name_ar FROM dir_brokers WHERE name_ar IS NOT NULL LIMIT 1"),
        ("community name", "community", "SELECT name_en FROM dir_communities WHERE name_en IS NOT NULL LIMIT 1"),
        ("project number", "project", "SELECT project_number FROM dir_projects WHERE project_number IS NOT NULL LIMIT 1"),
        ("licence number", "licence", "SELECT licence_number FROM dir_licences WHERE licence_number IS NOT NULL LIMIT 1"),
        ("permit number", "permit", "SELECT permit_number FROM dir_permits WHERE permit_number IS NOT NULL LIMIT 1"),
    ]
    results = []
    for label, entity_type, probe_sql in probes:
        query = conn.execute(probe_sql).fetchone()[0]
        normalized = normalize_alias(query)
        count = conn.execute(
            "SELECT count(*) FROM dir_search_index WHERE entity_type=? AND contains(aliases, ?)",
            [entity_type, normalized],
        ).fetchone()[0]
        results.append({"test": label, "entity_type": entity_type, "query": query, "normalized_query": normalized, "matches": count, "status": "pass" if count > 0 else "fail"})
    return results


def build(database: Path, output: Path, reports: Path) -> dict[str, Any]:
    conn = duckdb.connect(str(database), read_only=True)
    register_functions(conn)
    dates = {name: source_export_date(conn, table) for name, (table, _) in SOURCE_TABLES.items()}
    views = sql_views(conn, dates)
    # Materialize each sanitized relation once. Several reports and both export
    # passes reuse them, so keeping these as views would repeat Python Unicode
    # normalization for every query and make a rerun unnecessarily expensive.
    for entity, sql in views.items():
        conn.execute(f"CREATE OR REPLACE TEMP TABLE dir_{entity} AS {sql}")
    create_search_view(conn)

    output.mkdir(parents=True, exist_ok=True)
    for entity in OUTPUT_ENTITIES:
        conn.execute(
            f"COPY (SELECT * FROM dir_{entity} ORDER BY ALL) TO ? (FORMAT PARQUET, COMPRESSION ZSTD, OVERWRITE_OR_IGNORE true)",
            [str(output / f"{entity}.parquet")],
        )
    first_manifest = parquet_manifest(output)
    # Rewrite the same deterministic relations and prove that a rerun is byte-stable.
    for entity in OUTPUT_ENTITIES:
        conn.execute(
            f"COPY (SELECT * FROM dir_{entity} ORDER BY ALL) TO ? (FORMAT PARQUET, COMPRESSION ZSTD, OVERWRITE_OR_IGNORE true)",
            [str(output / f"{entity}.parquet")],
        )
    second_manifest = parquet_manifest(output)

    counts = {entity: conn.execute(f"SELECT count(*) FROM dir_{entity}").fetchone()[0] for entity in OUTPUT_ENTITIES}
    unique_specs = {
        "communities": "area_id", "developers": "developer_id", "projects": "project_id",
        "brokers": "broker_id", "broker_office_links": "hash(broker_id,source_office_id)",
        "offices": "office_id", "office_activities": "activity_key",
        "licences": "licence_key", "permits": "permit_id", "valuators": "valuator_key",
        "escrow_agents": "escrow_agent_number", "owner_associations": "association_key",
        "free_zone_companies": "company_number",
    }
    unique_results = []
    for entity, expression in unique_specs.items():
        total, distinct = conn.execute(f"SELECT count(*), count(DISTINCT {expression}) FROM dir_{entity}").fetchone()
        unique_results.append({"entity": entity, "rows": total, "distinct_keys": distinct, "duplicate_keys": total - distinct, "status": "pass" if total == distinct else "fail"})

    relation_rows = relationships(conn)
    search_rows = search_tests(conn)
    schema_rows = schema_contract(conn)
    public_search_fields = [row[0] for row in conn.execute("DESCRIBE dir_search_index").fetchall()]
    forbidden = sorted(set(public_search_fields) & FORBIDDEN_PUBLIC_FIELDS)
    entity_types = {row[0] for row in conn.execute("SELECT DISTINCT entity_type FROM dir_search_index").fetchall()}
    validation = {
        "status": "pass",
        "phase0_database_read_only": True,
        "approved_source_dataset_count": len(SOURCE_TABLES),
        "output_counts": counts,
        "unique_key_tests": unique_results,
        "relationship_test_count": len(relation_rows),
        "search_tests": search_rows,
        "search_entity_types": sorted(entity_types),
        "forbidden_public_fields_found": forbidden,
        "idempotent_rerun": first_manifest == second_manifest,
        "non_affiliation_wording": NON_AFFILIATION,
    }
    if any(row["status"] != "pass" for row in unique_results + search_rows):
        validation["status"] = "fail"
    if forbidden or entity_types != PUBLIC_SEARCH_TYPES or not validation["idempotent_rerun"]:
        validation["status"] = "fail"

    reports.mkdir(parents=True, exist_ok=True)
    write_json(reports / "summary.json", {"source_export_dates": dates, "output_counts": counts, "output_manifest": second_manifest})
    write_json(reports / "schema.json", schema_rows)
    write_csv(reports / "schema.csv", schema_rows)
    write_json(reports / "relationships.json", relation_rows)
    write_csv(reports / "relationships.csv", relation_rows)
    write_json(reports / "search_tests.json", search_rows)
    write_json(reports / "validation.json", validation)
    write_json(reports / "search_contract.json", {
        "fields": public_search_fields,
        "entity_types": sorted(PUBLIC_SEARCH_TYPES),
        "matching": ["normalized English names", "normalized Arabic names", "official registration/licence/project/permit numbers", "compact aliases without spaces"],
        "result_semantics": "Official registry match only; never an endorsement, ranking, recommendation, or availability claim.",
        "source_label": "Dubai Land Department via Dubai Pulse",
        "non_affiliation": NON_AFFILIATION,
    })
    write_json(reports / "privacy_policy.json", {
        "public": ["official English/Arabic names", "professional registration numbers", "licence/project/permit numbers", "status and validity dates", "official entity relationships"],
        "internal_by_default": sorted(CONTACT_FIELDS | {"participant_id", "matching-only source IDs", "normalized aliases"}),
        "excluded_from_outputs": sorted(FORBIDDEN_PUBLIC_FIELDS),
        "prohibited_inferences": ["endorsement", "ranking", "recommendation", "partner status", "quality score"],
    })
    conn.close()
    return validation


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=Path("data/dld/local/phase0.duckdb"))
    parser.add_argument("--output", type=Path, default=Path("data/dld/directory/phase1a"))
    parser.add_argument("--reports", type=Path, default=Path("reports/dld/phase1a"))
    args = parser.parse_args()
    if not args.database.is_file():
        parser.error(f"Verified Phase 0 database not found: {args.database}")
    validation = build(args.database, args.output, args.reports)
    # Keep console output compatible with the default Windows code page; report
    # files remain UTF-8 and preserve Arabic text without escaping.
    print(json.dumps(validation, indent=2, ensure_ascii=True))
    return 0 if validation["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
