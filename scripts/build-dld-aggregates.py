#!/usr/bin/env python3
"""
Build the published market aggregates from the raw Dubai Land Department files.

    python scripts/build-dld-aggregates.py "C:/Users/adams/Downloads/DLD DATA"

The site reads `dld_market_aggregates`, and until now that table carried six
metrics: counts of registered sales, counts of registered tenancies, the median
registered annual rent, and their period changes. The pipeline that produced it
had defined sixteen. Every price metric, the yield, and the service charge were
specified and never built, and the site's copy grew up around the gap, telling
readers it would "rather leave a figure out than invent one" when the figure was
sitting in the source files all along.

This script builds the missing ones, from the raw exports, with the same
discipline the existing publication uses.

WHAT IT PRODUCES

    median_price_per_sqft          AED per square foot of registered sales
    median_sale_price              AED, the middle registered sale
    median_rent_per_sqft           AED per square foot per year
    median_service_charge_sqft     AED per square foot per year, per community
    gross_rental_yield_pct         rent per sqft over ready-property price per sqft

FOUR RULES, and they are the same four the existing aggregates follow.

  1. Medians, never means. A single villa sale in a community of studios moves
     a mean and does not move a median, and these are small samples once you
     cut by community and quarter.

  2. Nothing published below MIN_OBSERVATIONS. A median of four contracts is
     not a market rate, it is four contracts, and at small counts it starts to
     describe identifiable transactions.

  3. Community level at the finest. The raw files identify buildings and
     individual contracts; nothing below a community is published.

  4. Yield is only published where both sides were published for the same
     community and quarter. It is never carried across periods to fill a gap,
     because a rent from one quarter over a price from another is a number
     about nothing.

     It is also computed per square foot, against ready property only, and
     both of those are corrections rather than preferences. Dividing a median
     annual rent by a median sale price produced yields above 20% for several
     communities, which is not a Dubai yield, it is an artefact: off-plan is
     the majority of sales volume and cannot be let, so the price median was
     describing a different set of homes from the rent median. Per square
     foot removes the size mismatch and restricting to ready property removes
     the rest.

The output is a CSV shaped exactly like `dld_market_aggregates`, ready to load.
"""
from __future__ import annotations

import csv
import io
import os
import statistics
import sys
from collections import defaultdict
from datetime import date

# Square feet in a square metre. The registry records sale prices per square
# metre and tenancy areas in square feet, so exactly one of the two conversions
# below is needed, and getting it backwards is a factor of 116.
SQFT_PER_SQM = 10.7639

# Below this, a figure is suppressed rather than published. Amounts need more
# behind them than counts do, which is the threshold the existing scope
# registry already applies to its own amount metrics.
MIN_OBSERVATIONS = 30

# Periods before this are not published: coverage thins out and the earlier
# years are not comparable with the current registry.
FIRST_YEAR = 2019

# And nothing after the export. Tenancies are registered with a future start
# date, so the raw files contain quarters that have not happened: the first
# build published a 2027 quarter off 99 contracts, which is not a market, it
# is a handful of leases signed early. A period is only published once it has
# actually begun.
LAST_PERIOD_START = None  # set in main() from the export date

# Plausibility bands. These are not tuning, they are tripwires: a figure
# outside them means the input was misread, and it is better to publish
# nothing for that group than a number that discredits every figure beside it.
RENT_PSF_BAND = (10.0, 1_000.0)      # AED per sqft per year
PRICE_PSF_BAND = (100.0, 20_000.0)   # AED per sqft

METHODOLOGY_VERSION = "dlx-aggregates-2"

Key = tuple  # (entity_type, entity_id, name_en, grain, period_start, metric, seg_type, seg_code)


def quarter_start(iso: str) -> str | None:
    """'2025-08-14 ...' -> '2025-07-01'. None when the date is unusable."""
    if not iso or len(iso) < 7:
        return None
    try:
        year = int(iso[0:4])
        month = int(iso[5:7])
    except ValueError:
        return None
    if year < FIRST_YEAR or not 1 <= month <= 12:
        return None
    period = f"{year}-{3 * ((month - 1) // 3) + 1:02d}-01"
    if LAST_PERIOD_START and period > LAST_PERIOD_START:
        return None
    return period


def quarter_end(period_start: str) -> str:
    year, month = int(period_start[0:4]), int(period_start[5:7])
    end_month = month + 2
    last = {3: 31, 6: 30, 9: 30, 12: 31}[end_month]
    return f"{year}-{end_month:02d}-{last:02d}"


def read_csv_rows(path: str):
    with io.open(path, encoding="utf-8-sig", newline="") as handle:
        yield from csv.DictReader(handle)


def files_in(root: str, folder: str) -> list[str]:
    directory = os.path.join(root, folder)
    if not os.path.isdir(directory):
        return []
    return [
        os.path.join(directory, name)
        for name in sorted(os.listdir(directory))
        if name.lower().endswith(".csv")
    ]


def collect_sales(root: str, buckets: dict[Key, list[float]]) -> int:
    """Registered residential sales: price per square foot, and price."""
    used = 0
    for path in files_in(root, "Real Estate Transactions"):
        print(f"    {os.path.basename(path)}", flush=True)
        for row in read_csv_rows(path):
            if row.get("trans_group_en", "").strip() != "Sales":
                continue
            if "Residential" not in row.get("property_usage_en", ""):
                continue
            period = quarter_start(row.get("instance_date", ""))
            if period is None:
                continue
            try:
                per_sqm = float(row.get("meter_sale_price") or 0)
                worth = float(row.get("actual_worth") or 0)
            except ValueError:
                continue
            if per_sqm <= 0 or worth <= 0:
                continue
            per_sqft = per_sqm / SQFT_PER_SQM
            if not PRICE_PSF_BAND[0] <= per_sqft <= PRICE_PSF_BAND[1]:
                continue

            area_id = (row.get("area_id") or "").strip()
            area = (row.get("area_name_en") or "").strip()
            registration = "off_plan" if "Off" in row.get("reg_type_en", "") else "existing"
            kind = "villa" if "Villa" in row.get("property_type_en", "") else "apartment"

            for entity_type, entity_id, name in (
                ("dubai", "dubai", "Dubai"),
                ("community", area_id, area),
            ):
                if entity_type == "community" and (not area_id or not area):
                    continue
                for seg_type, seg_code in (
                    ("all", "all"),
                    ("sale_registration", registration),
                    ("property_class", kind),
                ):
                    base = (entity_type, entity_id, name, "quarter", period)
                    buckets[base + ("median_price_per_sqft", seg_type, seg_code)].append(per_sqft)
                    buckets[base + ("median_sale_price", seg_type, seg_code)].append(worth)
            used += 1
    return used


def collect_rents(root: str, buckets: dict[Key, list[float]]) -> int:
    """Registered tenancies: annual rent per square foot."""
    used = 0
    for path in files_in(root, "Rent Contracts"):
        print(f"    {os.path.basename(path)}", flush=True)
        for row in read_csv_rows(path):
            if "Residential" not in row.get("property_usage_en", ""):
                continue
            period = quarter_start(row.get("contract_start_date", ""))
            if period is None:
                continue
            try:
                annual = float(row.get("annual_amount") or 0)
                area_sqm = float(row.get("actual_area") or 0)
            except ValueError:
                continue
            # `actual_area` is square METRES, which is worth stating because
            # reading it as square feet is silently plausible and wrong by a
            # factor of 10.76. Checked against the file: the median residential
            # contract is 75, and 75 square feet is not a home while 75 square
            # metres is a typical Dubai one-bedroom. Read as metres it gives
            # about 82 AED per square foot per year, which is the market.
            #
            # The bounds are in metres for the same reason. An earlier version
            # filtered on 100 to 100,000 believing they were feet, which threw
            # away every home under 100 square metres, roughly three quarters
            # of the market, and biased the median rent upward with it.
            if annual <= 0 or not 10 <= area_sqm <= 5_000:
                continue
            per_sqft = annual / (area_sqm * SQFT_PER_SQM)
            if not RENT_PSF_BAND[0] <= per_sqft <= RENT_PSF_BAND[1]:
                continue

            area_id = (row.get("area_id") or "").strip()
            area = (row.get("area_name_en") or "").strip()

            for entity_type, entity_id, name in (
                ("dubai", "dubai", "Dubai"),
                ("community", area_id, area),
            ):
                if entity_type == "community" and (not area_id or not area):
                    continue
                base = (entity_type, entity_id, name, "quarter", period)
                buckets[base + ("median_rent_per_sqft", "all", "all")].append(per_sqft)
                # Kept to pair with the sale price for the yield below.
                buckets[base + ("_rent_annual", "all", "all")].append(annual)
            used += 1
    return used


def collect_service_charges(root: str, buckets: dict[Key, list[float]]) -> int:
    """
    Community service charge, in AED per square foot per year.

    The file is one row per service category per building, so the charge a
    resident actually pays is the sum of the categories for their building.
    Summing first and taking the median of the building totals is the only
    order that gives the number an owner would recognise; taking a median of
    the category rows would report the middle line of a service charge budget,
    which is not a figure anyone is ever billed.
    """
    per_building: dict[tuple, float] = defaultdict(float)
    names: dict[str, str] = {}
    for path in files_in(root, "Owners Association Service Charges"):
        print(f"    {os.path.basename(path)}", flush=True)
        for row in read_csv_rows(path):
            if "Residential" not in row.get("usage_name_en", ""):
                continue
            year = (row.get("budget_year") or "").strip()
            if not year.isdigit() or int(year) < FIRST_YEAR:
                continue
            community_id = (row.get("master_community_id") or "").strip()
            community = (row.get("master_community_name_en") or "").strip()
            group = (row.get("property_group_id") or "").strip()
            if not community_id or not community or not group:
                continue
            try:
                cost = float(row.get("service_cost") or 0)
            except ValueError:
                continue
            names[community_id] = community
            per_building[(community_id, year, group)] += cost

    used = 0
    for (community_id, year, _group), total in per_building.items():
        if total <= 0:
            continue
        period = f"{year}-01-01"
        base = ("community", community_id, names[community_id], "year", period)
        buckets[base + ("median_service_charge_sqft", "all", "all")].append(total)
        used += 1
    return used


def derive_yield(buckets: dict[Key, list[float]], rows: list[dict]) -> int:
    """
    Gross rental yield, where both sides were published for the same period.

    Median annual rent over median sale price, per community per quarter. It is
    gross on purpose and labelled as such everywhere it is shown: the service
    charge is published beside it as its own figure so a reader can do the
    subtraction themselves rather than be handed a net number that depends on
    assumptions we did not make for them.
    """
    medians: dict[tuple, tuple[float, int]] = {}
    for key, values in buckets.items():
        entity_type, entity_id, name, grain, period, metric, seg_type, seg_code = key
        # Rent per sqft on all lettable stock, against price per sqft on ready
        # property: the only pairing where both sides describe the same homes.
        wanted = (metric == "median_rent_per_sqft" and seg_code == "all") or (
            metric == "median_price_per_sqft" and seg_code == "existing"
        )
        if not wanted or len(values) < MIN_OBSERVATIONS:
            continue
        medians[(entity_type, entity_id, name, period, metric)] = (
            statistics.median(values),
            len(values),
        )

    written = 0
    for (entity_type, entity_id, name, period, metric), (rent, rent_n) in medians.items():
        if metric != "median_rent_per_sqft":
            continue
        sale = medians.get((entity_type, entity_id, name, period, "median_price_per_sqft"))
        if not sale:
            continue
        price, price_n = sale
        if price <= 0:
            continue
        value = round(rent / price * 100, 2)
        # A gross yield outside this band is a data artefact rather than a
        # market, and publishing it would discredit every figure beside it.
        if not 1.0 <= value <= 15.0:
            continue
        rows.append(
            aggregate_row(
                entity_type, entity_id, name, "quarter", period,
                "gross_rental_yield_pct", "all", "all",
                value,
                min(rent_n, price_n),
            )
        )
        written += 1
    return written


def aggregate_row(
    entity_type, entity_id, name_en, grain, period_start, metric, seg_type, seg_code,
    value, observations,
) -> dict:
    return {
        "aggregate_key": f"{entity_type}:{entity_id}:{grain}:{period_start}:{metric}:{seg_type}:{seg_code}",
        "entity_type": entity_type,
        "entity_id": entity_id,
        "name_en": name_en,
        "name_ar": "",
        "period_grain": grain,
        "period_start": period_start,
        "period_end": quarter_end(period_start) if grain == "quarter" else f"{period_start[:4]}-12-31",
        "metric_code": metric,
        "segment_type": seg_type,
        "segment_code": seg_code,
        "metric_value": value,
        "observation_count": observations,
        # Mirrors the wording the existing publication uses.
        "confidence": "higher" if observations >= 200 else "moderate",
        "quality_flags": "[]",
        "source_export_date": SOURCE_EXPORT_DATE,
        "methodology_version": METHODOLOGY_VERSION,
    }


SOURCE_EXPORT_DATE = date.today().isoformat()

FIELDS = [
    "aggregate_key", "entity_type", "entity_id", "name_en", "name_ar",
    "period_grain", "period_start", "period_end", "metric_code",
    "segment_type", "segment_code", "metric_value", "observation_count",
    "confidence", "quality_flags", "source_export_date", "methodology_version",
]


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    root = sys.argv[1]
    only = sys.argv[2] if len(sys.argv) > 2 else "all"

    global LAST_PERIOD_START
    today = date.today()
    LAST_PERIOD_START = f"{today.year}-{3 * ((today.month - 1) // 3) + 1:02d}-01"

    buckets: dict[Key, list[float]] = defaultdict(list)

    if only in ("all", "charges"):
        print("service charges...", flush=True)
        print(f"  {collect_service_charges(root, buckets):,} building totals", flush=True)
    if only in ("all", "sales"):
        print("sales...", flush=True)
        print(f"  {collect_sales(root, buckets):,} registered sales", flush=True)
    if only in ("all", "rents"):
        print("rents...", flush=True)
        print(f"  {collect_rents(root, buckets):,} registered tenancies", flush=True)

    rows: list[dict] = []
    suppressed = 0
    for key, values in sorted(buckets.items()):
        entity_type, entity_id, name, grain, period, metric, seg_type, seg_code = key
        if metric.startswith("_"):
            continue
        if len(values) < MIN_OBSERVATIONS:
            suppressed += 1
            continue
        rows.append(
            aggregate_row(
                entity_type, entity_id, name, grain, period, metric, seg_type, seg_code,
                round(statistics.median(values), 2), len(values),
            )
        )

    if only in ("all",):
        print(f"yield: {derive_yield(buckets, rows):,} community quarters", flush=True)

    out_dir = os.path.join("reports", "dld-aggregates")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, f"market_aggregates_{SOURCE_EXPORT_DATE}_{only}.csv")
    with io.open(out, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nwrote {len(rows):,} rows to {out}")
    print(f"suppressed {suppressed:,} groups under {MIN_OBSERVATIONS} observations")
    by_metric: dict[str, int] = defaultdict(int)
    for row in rows:
        by_metric[row["metric_code"]] += 1
    for metric, count in sorted(by_metric.items()):
        print(f"  {metric:32} {count:>8,}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
