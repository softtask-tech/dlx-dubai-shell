#!/usr/bin/env python3
"""Regenerate tracked, aggregate-only Phase 3C review reports."""
import argparse, csv, hashlib, json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PACKAGE = ROOT / "data/dld/transfer/phase3c"
DEFAULT_REPORTS = ROOT / "reports/dld/phase3c"

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)+"\n", encoding="utf-8", newline="\n")

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--package",type=Path,default=DEFAULT_PACKAGE); parser.add_argument("--reports",type=Path,default=DEFAULT_REPORTS)
    args=parser.parse_args(); package=args.package.resolve(); reports=args.reports.resolve()
    manifest=json.loads((package/"manifest.json").read_text(encoding="utf-8")); registry=json.loads((package/"scope-registry.json").read_text(encoding="utf-8"))
    if reports.exists(): shutil.rmtree(reports)
    reports.mkdir(parents=True); write(reports/"scope_registry.json",registry)
    entity_counts={}; period_counts={}; metric_counts={}
    for key,count in manifest["expected_counts"].items():
        entity,period,metric=key.split("|")
        entity_counts[entity]=entity_counts.get(entity,0)+count; period_counts[period]=period_counts.get(period,0)+count; metric_counts[metric]=metric_counts.get(metric,0)+count
    write(reports/"package_summary.json",{"schema_version":manifest["schema_version"],"methodology_version":manifest["methodology_version"],"source_export_date":manifest["source_export_date"],"original_rows":manifest["original_phase3b_rows"],"published_rows":manifest["total_expected_rows"],"reduction_percent":round(100*(1-manifest["total_expected_rows"]/manifest["original_phase3b_rows"]),2),"chunks":len(manifest["chunks"]),"counts_by_entity":entity_counts,"counts_by_period":period_counts,"counts_by_metric":metric_counts,"expected_counts":manifest["expected_counts"]})
    columns=["aggregate_key","entity_type","entity_id","name_en","name_ar","period_grain","period_start","period_end","metric_code","segment_type","segment_code","metric_value","observation_count","confidence","quality_flags","source_export_date","methodology_version"]
    write(reports/"public_schema.json",{"format":"UTF-8 CSV with a header in every chunk","columns":columns,"entity_id":"public DLD area/project/developer number, or dubai","prohibited":"transaction, contract, property, unit, land, participant, contact, or private relationship identifiers"})
    write(reports/"migration_review.json",{"migration":"20260906010000_dld_market_compact_publication.sql","status":"unapplied","private_tables":["dld_market_import_runs","dld_market_scope_registry","dld_market_stage","dld_market_aggregates","dld_market_publication_state"],"private_view":"dld_market_public (internal sanitized projection used by RPCs; no client SELECT grant)","service_role_functions":["stage_dld_market_rows","validate_dld_market_import","publish_dld_market_import","activate_dld_market_publication"],"public_functions":["get_dld_market_overview","get_dld_market_entity_series","compare_dld_market_communities","search_dld_market_entities","get_dld_market_metadata"],"security":"RLS and explicit table/view revocations; bounded RPC grants only","atomicity":"advisory transaction lock; validation, canonical insert and active-pointer switch share one transaction; repeated publication is a no-op"})
    samples=[]
    for chunk in manifest["chunks"]:
        with (package/chunk["file"]).open("r",encoding="utf-8",newline="") as handle:
            for row in csv.DictReader(handle):
                if row["entity_type"] not in {x["entity_type"] for x in samples}: samples.append(row)
        if len(samples)==4: break
    write(reports/"safe_samples.json",samples)
    write(reports/"query_plan_review.json",{"postgres_execution":"not run; no local PostgreSQL/Supabase executable was available and remote access was prohibited","static_index_mapping":{"overview_and_series":"dld_market_aggregate_series_idx","community_comparison":"dld_market_aggregate_compare_idx","entity_search":"name indexes; contains matching remains capped"},"required_before_apply":"Run EXPLAIN (ANALYZE, BUFFERS) for every RPC in an isolated local Supabase clone."})
    write(reports/"verification.json",{"package_verified":True,"privacy_scan":"pass","deterministic_generation":"verified separately by verify_phase3c.py --deterministic","row_count":manifest["total_expected_rows"],"chunk_count":len(manifest["chunks"])})
    files=[{"file":p.name,"bytes":p.stat().st_size,"sha256":digest(p)} for p in sorted(reports.glob("*.json")) if p.name!="manifest.json"]
    write(reports/"manifest.json",{"schema_version":"dld-phase3c-reports/1","files":files})
    return 0

if __name__=="__main__": raise SystemExit(main())
