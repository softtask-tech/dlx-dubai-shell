#!/usr/bin/env python3
"""Shared, network-free Phase 1D transfer contract."""

from __future__ import annotations

import datetime as dt
import hashlib
import re
from typing import Any


SCHEMA_VERSION = "dld-directory-transfer/1"
METHODOLOGY_VERSION = "phase1d-sanitized-v1"
MAX_CHUNK_BYTES = 4 * 1024 * 1024
ENTITY_ORDER = (
    "communities", "developers", "escrow_agents", "offices", "brokers",
    "projects", "office_activities", "broker_office_links", "licences",
    "permits", "valuators", "owner_associations", "free_zone_companies",
)
EXPECTED_COUNTS = {
    "communities": 301, "developers": 2348, "projects": 3039,
    "brokers": 8709, "broker_office_links": 8724, "offices": 2574,
    "office_activities": 4963, "licences": 2948, "permits": 175056,
    "valuators": 153, "escrow_agents": 25, "owner_associations": 110,
    "free_zone_companies": 250,
}
MAX_COUNTS = {
    "communities": 10_000, "developers": 100_000, "projects": 100_000,
    "brokers": 250_000, "broker_office_links": 500_000, "offices": 100_000,
    "office_activities": 250_000, "licences": 250_000, "permits": 2_000_000,
    "valuators": 50_000, "escrow_agents": 10_000, "owner_associations": 50_000,
    "free_zone_companies": 100_000,
}
SAFE_FIELDS = {
    "communities": ("municipality_number", "name_en", "name_ar", "source_export_date", "source_dataset"),
    "developers": ("developer_number", "name_en", "name_ar", "registration_date", "licence_number", "licence_source_en", "licence_source_ar", "licence_issue_date", "licence_expiry_date", "legal_status_en", "legal_status_ar", "source_export_date", "source_dataset"),
    "escrow_agents": ("escrow_agent_number", "name_en", "name_ar", "source_export_date", "source_dataset"),
    "offices": ("office_number", "name_en", "name_ar", "licence_number", "licence_source_en", "licence_source_ar", "licence_issue_date", "licence_expiry_date", "is_branch", "source_export_date", "source_dataset"),
    "brokers": ("broker_number", "name_en", "name_ar", "licence_start_date", "licence_end_date", "source_export_date", "source_dataset"),
    "projects": ("project_number", "source_name", "name_en", "name_ar", "developer_number", "developer_relationship_state", "master_developer_number", "community_municipality_number", "community_name_en", "community_name_ar", "community_relationship_state", "escrow_agent_number", "escrow_relationship_state", "area_name_en", "area_name_ar", "status_en", "status_ar", "percent_completed", "project_start_date", "project_end_date", "completion_date", "cancellation_date", "no_of_units", "no_of_villas", "no_of_buildings", "source_export_date", "source_dataset"),
    "office_activities": ("office_number", "activity_type_id", "activity_name_en", "activity_name_ar", "ded_activity_code", "source_export_date", "source_dataset"),
    "broker_office_links": ("broker_number", "office_number", "office_relationship_state", "licence_start_date", "licence_end_date", "source_export_date", "source_dataset"),
    "licences": ("activity_type_id", "activity_name_en", "activity_name_ar", "licence_number", "trade_name_en", "trade_name_ar", "status_en", "status_ar", "issue_date", "expiry_date", "cancel_date", "legal_type_en", "legal_type_ar", "ded_activity_code", "authority_id", "office_number", "office_relationship_state", "developer_number", "developer_relationship_state", "source_export_date", "source_dataset"),
    "permits": ("permit_number", "licence_number", "participant_name_en", "participant_name_ar", "service_id", "service_en", "service_ar", "main_service_en", "main_service_ar", "status_en", "status_ar", "start_date", "end_date", "exhibition_name_en", "exhibition_name_ar", "source_export_date", "source_dataset"),
    "valuators": ("valuator_number", "name_en", "name_ar", "valuation_company_number", "company_name_en", "company_name_ar", "licence_start_date", "licence_end_date", "source_export_date", "source_dataset"),
    "owner_associations": ("name_en", "name_ar", "source_export_date", "source_dataset"),
    "free_zone_companies": ("company_number", "name_en", "name_ar", "licence_number", "licence_source_en", "licence_source_ar", "licence_issue_date", "licence_expiry_date", "source_export_date", "source_dataset"),
}
PROHIBITED_KEY_PARTS = (
    "alias", "phone", "email", "fax", "nationality", "gender", "demographic",
    "participant_id", "source_office_id", "source_developer_id", "main_office_id",
    "latitude", "longitude", "coordinate", "matched_office_id",
    "matched_developer_id", "area_id", "developer_id", "office_id", "broker_id",
    "project_id", "permit_id", "licence_key", "activity_key", "valuator_key",
    "association_key", "raw_source",
)
ARABIC_RE = re.compile(r"[\u0600-\u06ff]")


def source_key(entity: str, internal_key: Any) -> str:
    material = f"{METHODOLOGY_VERSION}\x1f{entity}\x1f{internal_key}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def json_value(value: Any) -> Any:
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.hex()
    return value


def forbidden_keys(value: Any, prefix: str = "") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            path = f"{prefix}.{key}" if prefix else key
            lowered = key.lower()
            if key not in {"entity_type", "source_key", "payload"} and any(part in lowered for part in PROHIBITED_KEY_PARTS):
                found.append(path)
            found.extend(forbidden_keys(child, path))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(forbidden_keys(child, f"{prefix}[{index}]"))
    return found


def validate_envelope(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if set(record) != {"entity_type", "source_key", "payload"}:
        errors.append("envelope keys must be entity_type, source_key and payload")
    entity = record.get("entity_type")
    if entity not in SAFE_FIELDS:
        errors.append(f"invalid entity_type {entity!r}")
        return errors
    if not re.fullmatch(r"[0-9a-f]{64}", str(record.get("source_key", ""))):
        errors.append("source_key must be a 64-character lowercase SHA-256")
    payload = record.get("payload")
    if not isinstance(payload, dict):
        errors.append("payload must be an object")
        return errors
    supplied = set(payload)
    allowed = set(SAFE_FIELDS[entity])
    if supplied != allowed:
        errors.append(f"payload field mismatch: missing={sorted(allowed-supplied)} extra={sorted(supplied-allowed)}")
    errors.extend(f"prohibited field {path}" for path in forbidden_keys(record))
    return errors


def validate_expected_counts(counts: Any, maximums: dict[str, int] | None = None) -> list[str]:
    """Mirror the server's exact-key, integer, positive-total and ceiling checks."""
    limits = maximums or MAX_COUNTS
    if not isinstance(counts, dict):
        return ["expected_counts must be an object"]
    required = set(ENTITY_ORDER)
    supplied = set(counts)
    errors = [f"missing entity count: {key}" for key in sorted(required - supplied)]
    errors.extend(f"unknown entity count: {key}" for key in sorted(supplied - required))
    total = 0
    for entity in sorted(required & supplied):
        value = counts[entity]
        if isinstance(value, bool) or not isinstance(value, int):
            errors.append(f"non-integer count: {entity}")
        elif value < 0:
            errors.append(f"negative count: {entity}")
        elif value > limits[entity]:
            errors.append(f"excessive count: {entity}")
        else:
            total += value
    if not errors and total == 0:
        errors.append("total expected records must be greater than zero")
    return errors
