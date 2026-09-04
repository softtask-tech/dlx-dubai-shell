#!/usr/bin/env python3
"""Unit/static tests for the Phase 1D transfer and atomic publication rules."""

from __future__ import annotations

import copy
import re
import unittest
from pathlib import Path

from scripts.dld.phase1d_contract import (
    ENTITY_ORDER, MAX_COUNTS, SAFE_FIELDS, forbidden_keys, source_key,
    validate_envelope, validate_expected_counts,
)

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20260905010000_dld_directory_sanitized_import.sql"


def normalize(value: str | None) -> str:
    value = (value or "").lower().translate(str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ؤ": "و", "ئ": "ي", "ـ": None}))
    return " ".join(re.sub(r"[^0-9a-z\u0621-\u064a]+", " ", value).split())


def aliases(values: list[str | None]) -> str:
    seen: set[str] = set()
    result = []
    for value in values:
        normalized = normalize(value)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return " ".join(result)


class AtomicModel:
    """Small independent model of the SQL preflight/transaction guarantees."""

    def __init__(self) -> None:
        self.published: dict[str, list[dict]] = {"offices": [{"office_number": "OLD"}]}
        self.published_runs: set[str] = set()

    def publish(self, run: str, staged: dict[str, list[dict]], expected: dict[str, int]) -> None:
        if run in self.published_runs:
            return
        before = copy.deepcopy(self.published)
        try:
            if any(len(staged.get(entity, [])) != count for entity, count in expected.items()):
                raise ValueError("count mismatch")
            offices: dict[str, int] = {}
            for row in staged.get("offices", []):
                number = row["office_number"]
                offices[number] = offices.get(number, 0) + 1
            for link in staged.get("broker_office_links", []):
                state, number = link["office_relationship_state"], link.get("office_number")
                if state == "matched" and offices.get(number, 0) == 0:
                    raise ValueError("missing office")
                if state == "matched" and offices.get(number, 0) > 1:
                    raise ValueError("ambiguous office")
                if state in {"none", "unmatched"} and number is not None:
                    raise ValueError("identifier on unresolved link")
            self.published = copy.deepcopy(staged)
            self.published_runs.add(run)
        except Exception:
            self.published = before
            raise


class ContractTests(unittest.TestCase):
    def envelope(self, entity: str) -> dict:
        return {"entity_type": entity, "source_key": source_key(entity, "fixture"), "payload": {field: None for field in SAFE_FIELDS[entity]}}

    def test_aliases_are_omitted_and_rejected(self) -> None:
        record = self.envelope("developers")
        self.assertNotIn("aliases", record["payload"])
        record["payload"]["aliases"] = "not accepted"
        self.assertTrue(validate_envelope(record))

    def test_alias_generation_is_deterministic(self) -> None:
        values = ["Acme Properties", "أكمي للعقارات", "123", "Acme Properties"]
        self.assertEqual(aliases(values), aliases(values))
        self.assertEqual(aliases(values), "acme properties اكمي للعقارات 123")

    def test_duplicate_normalized_names_do_not_resolve_relationships(self) -> None:
        self.assertEqual(normalize("Mushrif"), normalize("MUSHRIF"))
        offices = [{"office_number": "1", "name": "Same"}, {"office_number": "2", "name": "Same"}]
        self.assertEqual([x["office_number"] for x in offices if x["office_number"] == "2"], ["2"])

    def test_missing_and_ambiguous_office_relationships_fail(self) -> None:
        expected = {"offices": 1, "broker_office_links": 1}
        for offices, message in [([{"office_number": "1"}], "missing office"), ([{"office_number": "2"}, {"office_number": "2"}], "count mismatch")]:
            model = AtomicModel()
            links = [{"office_number": "2", "office_relationship_state": "matched"}]
            with self.assertRaisesRegex(ValueError, message):
                model.publish("r", {"offices": offices, "broker_office_links": links}, expected)
        model = AtomicModel()
        with self.assertRaisesRegex(ValueError, "ambiguous office"):
            model.publish("r", {"offices": [{"office_number": "2"}, {"office_number": "2"}], "broker_office_links": [{"office_number": "2", "office_relationship_state": "matched"}]}, {"offices": 2, "broker_office_links": 1})

    def test_idempotent_reimport(self) -> None:
        model = AtomicModel()
        staged = {"offices": [{"office_number": "1"}], "broker_office_links": []}
        expected = {"offices": 1, "broker_office_links": 0}
        model.publish("r", staged, expected)
        first = copy.deepcopy(model.published)
        model.publish("r", {"offices": [{"office_number": "CHANGED"}]}, {"offices": 1})
        self.assertEqual(model.published, first)

    def test_manifest_count_mismatch_and_full_rollback(self) -> None:
        model = AtomicModel()
        before = copy.deepcopy(model.published)
        with self.assertRaisesRegex(ValueError, "count mismatch"):
            model.publish("r", {"offices": []}, {"offices": 1})
        self.assertEqual(model.published, before)

    def test_later_snapshot_counts_need_no_migration(self) -> None:
        later = {entity: 1 for entity in ENTITY_ORDER}
        later["permits"] = 200_000
        later["developers"] = 3_000
        self.assertEqual(validate_expected_counts(later), [])

    def test_manifest_count_shape_and_bounds(self) -> None:
        valid = {entity: 1 for entity in ENTITY_ORDER}
        cases = {
            "malformed": [],
            "missing": {key: value for key, value in valid.items() if key != "projects"},
            "extra": {**valid, "search_index": 1},
            "negative": {**valid, "projects": -1},
            "non_integer": {**valid, "projects": 1.5},
            "excessive": {**valid, "permits": MAX_COUNTS["permits"] + 1},
            "zero_total": {entity: 0 for entity in ENTITY_ORDER},
        }
        for name, counts in cases.items():
            with self.subTest(name=name):
                self.assertTrue(validate_expected_counts(counts), name)

    def test_successful_atomic_publication(self) -> None:
        model = AtomicModel()
        staged = {"offices": [{"office_number": "1"}], "broker_office_links": [{"office_number": "1", "office_relationship_state": "matched"}]}
        model.publish("r", staged, {"offices": 1, "broker_office_links": 1})
        self.assertEqual(model.published, staged)

    def test_transfer_contract_has_no_prohibited_fields(self) -> None:
        for entity in SAFE_FIELDS:
            self.assertEqual(forbidden_keys(self.envelope(entity)), [], entity)

    def test_migration_security_and_atomic_contract(self) -> None:
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        compact = re.sub(r"\s+", "", sql)
        for entity, fields in SAFE_FIELDS.items():
            expected_allowlist = f"when'{entity}'thenarray[" + ",".join(f"'{field}'" for field in fields) + "]"
            self.assertIn(expected_allowlist, compact, entity)
        self.assertNotRegex(sql, r"\b(drop table|truncate)\b")
        self.assertIn("payload_schema_mismatch", sql)
        self.assertIn("duplicate_stable_identifier", sql)
        self.assertIn("missing_parent", sql)
        self.assertIn("ambiguous_parent", sql)
        self.assertIn("unmatched_relationship", sql)
        self.assertIn("pg_advisory_xact_lock", sql)
        self.assertIn("refresh materialized view public.dld_directory_search_index", sql)
        self.assertNotIn("dld_directory_transfer_expected_count", sql)
        self.assertIn("create table if not exists public.dld_directory_transfer_limits", sql)
        self.assertIn("manifest_sha256", sql)
        self.assertIn("unknown_entity_count", sql)
        self.assertIn("missing_entity_count", sql)
        self.assertIn("invalid_entity_count", sql)
        self.assertIn("excessive_entity_count", sql)
        self.assertIn("zero_total_records", sql)
        self.assertIn("staged_count_mismatch", sql)
        self.assertIn("manifest_count_contract_mismatch", sql)
        self.assertIn("revoke all on function public.publish_dld_directory_sanitized", sql)
        self.assertNotIn("grant execute on function public.publish_dld_directory_sanitized(uuid) to anon", sql)


if __name__ == "__main__":
    unittest.main()
