#!/usr/bin/env python3
"""Static and artifact validation for DLD Phase 1B without database/network access."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
FOUNDATION = ROOT / "supabase/migrations/20260904010000_dld_directory_foundation.sql"
IMPORT = ROOT / "supabase/migrations/20260904010100_dld_directory_atomic_import.sql"
REPORT = ROOT / "reports/dld/phase1b/verification.json"
FORBIDDEN = ("phone", "email", "fax", "nationality", "gender", "participant_id", "aliases", "latitude", "longitude")


def view_body(sql: str, name: str) -> str:
    match = re.search(rf"create or replace view public\.{re.escape(name)}\b.*?\bas\b(.*?);", sql, re.I | re.S)
    return match.group(1).lower() if match else ""


def main() -> int:
    foundation = FOUNDATION.read_text(encoding="utf-8")
    publish = IMPORT.read_text(encoding="utf-8")
    combined = foundation + "\n" + publish
    checks: list[dict[str, object]] = []

    def check(name: str, condition: bool, detail: object = None) -> None:
        checks.append({"check": name, "status": "pass" if condition else "fail", "detail": detail})

    check("additive migrations", not re.search(r"\b(drop|truncate)\b", combined, re.I))
    check("curated changes are nullable bridges only", all(token in foundation for token in (
        "areas add column if not exists dld_directory_area_id text",
        "developers add column if not exists dld_directory_developer_id text",
        "projects add column if not exists dld_directory_project_id text",
    )) and not re.search(r"\b(update|delete from|insert into)\s+public\.(areas|developers|projects)\b", combined, re.I))
    check("curated links survive snapshot refresh", foundation.lower().count("on delete no action deferrable initially deferred") == 3)
    check("canonical RLS", "enable row level security" in foundation.lower() and "revoke all on public.dld_directory_" in foundation.lower())
    check("public views are explicit definer barriers", foundation.lower().count("security_barrier=true, security_invoker=false") >= 13)
    public_views = re.findall(r"create or replace view public\.(dld_directory_[a-z_]+_public)\b", foundation, re.I)
    leaked: dict[str, list[str]] = {}
    for view in public_views:
        body = view_body(foundation, view)
        found = [field for field in FORBIDDEN if re.search(rf"\b{field}\b", body)]
        if found:
            leaked[view] = found
    search_body = view_body(publish, "dld_directory_search_public")
    search_leaks = [field for field in FORBIDDEN if re.search(rf"\b{field}\b", search_body)]
    check("entity public views exclude private fields", not leaked, leaked)
    check("search public view excludes private fields", not search_leaks, search_leaks)
    check("owner coordinates internal", "latitude" not in view_body(foundation, "dld_directory_owner_associations_public") and "longitude" not in view_body(foundation, "dld_directory_owner_associations_public"))
    check("search index private", "revoke all on public.dld_directory_search_index from public, anon, authenticated" in publish)
    check("search RPC whitelist", "returns table(entity_type text, source_key text" in publish and "related_context jsonb" in publish)
    check("search pagination and filters", all(token in publish for token in ("entity_types text[]", "page_number integer", "page_size integer", "offset (greatest")))
    check("exact number priority", "then 0 else 1 end" in publish)
    check("search indexes", "dld_directory_search_identity_idx" in publish and "dld_directory_search_aliases_trgm_idx" in publish)
    check("staging deterministic key", "primary key (import_run_id, entity_type, source_key)" in publish)
    importer = (ROOT / "scripts/dld/import_directory.py").read_text(encoding="utf-8")
    check("staging retry upsert", "resolution=merge-duplicates" in importer and "--run-id" in importer)
    check("publish idempotent", "status = 'published'" in publish and re.search(r"status = 'published'\).*?return;", publish, re.S) is not None)
    check("publish atomic lock", "pg_advisory_xact_lock" in publish and "set constraints all deferred" in publish)
    check("unexpected staging entities rejected", "Unexpected entity type" in publish)
    check("public wording", "Recorded in DLD open data" in (ROOT / "src/data/directory-types.ts").read_text(encoding="utf-8"))
    check("disclaimer exact", "Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied." in combined and "Independent directory using Dubai Land Department open data; no affiliation or endorsement is implied." in (ROOT / "src/data/directory-types.ts").read_text(encoding="utf-8"))
    check("status notice exact", "Status as recorded in the DLD export dated ${exportDate}. Verify current status with the relevant authority." in (ROOT / "src/data/directory-types.ts").read_text(encoding="utf-8"))
    route_files = [
        "directory/index.tsx", "directory/developers/index.tsx", "directory/developers/$slug.tsx",
        "directory/projects/index.tsx", "directory/projects/$slug.tsx", "directory/brokers/index.tsx",
        "directory/brokers/$id.tsx", "directory/offices/index.tsx", "directory/offices/$id.tsx",
        "directory/licences.tsx", "directory/permits.tsx", "directory/valuators.tsx", "directory/escrow-agents.tsx",
    ]
    check("required routes", all((ROOT / "src/routes" / path).is_file() for path in route_files))
    browser_files = [ROOT / "src/components/directory/directory-page.tsx", ROOT / "src/data/directory.functions.ts", ROOT / "src/data/directory-route.ts"]
    browser_text = "\n".join(path.read_text(encoding="utf-8") for path in browser_files)
    check("no browser database access", "integrations/supabase" not in browser_text and "dld_directory_stage" not in browser_text)
    check("server reads public surfaces only", all(token not in (ROOT / "src/data/directory.server.ts").read_text(encoding="utf-8") for token in ("dld_directory_stage", "dld_directory_import_runs", "dld_directory_communities")))

    result = {
        "status": "pass" if all(item["status"] == "pass" for item in checks) else "fail",
        "database_execution": "not_run_local_postgresql_unavailable",
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
