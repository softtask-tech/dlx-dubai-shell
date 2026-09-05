#!/usr/bin/env python3
"""Safe unit/static tests for the Phase 3C publication contract."""

import hashlib
import json
import tempfile
import unittest
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from phase3c_package import FIELDS, PROHIBITED_TOKENS, aggregate_key, observation_is_publishable, public_metric, public_segment, registry_predicate


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = json.loads((ROOT / "scripts/dld/phase3c_scope_registry.json").read_text(encoding="utf-8"))
MIGRATION = ROOT / "supabase/migrations/20260906010000_dld_market_compact_publication.sql"


class Phase3CTests(unittest.TestCase):
    def test_registry_is_explicit_and_bounded(self):
        sql = registry_predicate(REGISTRY)
        self.assertIn("entity_type", sql)
        self.assertIn("segment_key", sql)
        self.assertNotIn("cartesian", sql.lower())

    def test_public_wording_and_segments(self):
        self.assertEqual(public_metric("sales", "sales_count", "all", "all"), "registered_sale_count")
        self.assertEqual(public_metric("rent", "rent_count", "registration_type", "registration:2"), "registered_renewed_rental_contract_count")
        self.assertEqual(public_segment("sales", "property_class", "property_subtype:60"), ("property_class", "apartment"))
        with self.assertRaises((ValueError, KeyError)):
            public_segment("sales", "unknown", "all")
        with self.assertRaises(ValueError):
            public_metric("sales", "median_sale_price", "all", "all")

    def test_aggregate_key_is_deterministic(self):
        record = {key: "x" for key in FIELDS}
        record.update(entity_type="community", entity_id="1", period_grain="year", period_start="2025-01-01", period_end="2025-12-31", metric_code="registered_sale_count", segment_type="all", segment_code="all", methodology_version="v1")
        self.assertEqual(aggregate_key(record), aggregate_key(dict(record)))
        self.assertEqual(len(aggregate_key(record)), 64)

    def test_privacy_schema(self):
        self.assertFalse(PROHIBITED_TOKENS.intersection(FIELDS))
        self.assertNotIn("payload", FIELDS)

    def test_migration_security_and_atomicity(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        for token in ("enable row level security", "revoke all", "service_role", "security definer", "pg_advisory_xact_lock", "validate_dld_market_import", "publish_dld_market_import"):
            self.assertIn(token, sql)
        self.assertNotIn("grant select on public.dld_market_aggregates to anon", sql)
        self.assertNotIn("grant select on public.dld_market_public to anon", sql)
        self.assertIn("greatest(1,least", sql)
        self.assertIn("dld_market_scope_allowed", sql)
        self.assertIn("already_published", sql)

    def test_manifest_mismatch_and_idempotency_contract(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        self.assertIn("staged_count_mismatch", sql)
        self.assertIn("expected_counts", sql)
        self.assertIn("on conflict (import_run_id,aggregate_key) do update", sql)
        self.assertIn("raise exception", sql)

    def test_threshold_and_completion_contract(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        self.assertIn("observation_count < 10", sql)
        self.assertIn("then 30 else 10 end", sql)
        self.assertIn("2010-01-01", sql)
        self.assertIn("date_trunc('month'", sql)
        self.assertIn("date_trunc('quarter'", sql)
        self.assertIn("date_trunc('year'", sql)

    def test_10_to_29_is_count_only_and_30_enables_values(self):
        self.assertTrue(observation_is_publishable("registered_sale_count", 10))
        self.assertTrue(observation_is_publishable("registered_rental_contract_count", 29))
        self.assertFalse(observation_is_publishable("median_registered_annual_rent_aed", 29))
        self.assertFalse(observation_is_publishable("registered_sale_count_change", 29))
        self.assertTrue(observation_is_publishable("median_registered_annual_rent_aed", 30))
        self.assertTrue(observation_is_publishable("registered_sale_count_change", 30))

    def test_no_blocked_metrics_or_private_terms(self):
        registry_text = json.dumps(REGISTRY).lower()
        for term in ("median_sale_price", "unit_price", "gross_yield", "residential_sale_index", "transaction_id", "contract_id"):
            self.assertNotIn(term, registry_text)

    def test_arabic_round_trip(self):
        text = "دبي مارينا"
        self.assertEqual(text.encode("utf-8").decode("utf-8"), text)


if __name__ == "__main__":
    unittest.main()
