import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { MarketRow } from "@/data/market-public";
import { cn } from "@/lib/utils";

/**
 * Where to look, ranked.
 *
 * This is the piece the market pages were missing. Everything else here
 * describes Dubai as one thing: how many sales, what the middle rent was, which
 * way the mix moved. None of it answers the question a buyer actually arrives
 * with, which is not "how is the market" but "which communities should I be
 * looking at, and what would owning there actually cost me".
 *
 * Four published figures side by side answer it, and no portal puts them
 * together: what a square foot sells for, what a square foot rents for, the
 * gross yield those two imply, and the service charge that comes off it. The
 * last one is the reason this table earns its place. Yield tables are
 * everywhere; a yield table with the holding cost beside it is not, and the
 * gap between a 7% gross and the same building after 27 AED a square foot of
 * service charge is the difference between a good buy and a bad one.
 *
 * SORTED, NOT FILTERED. Every community that clears the publication threshold
 * is here. A filter would let the page quietly present a shortlist as if it
 * were the market, and the one thing this table is for is showing the whole
 * field, including the parts of it DLX does not sell in.
 */
export type LeagueColumn = {
  key: string;
  label: string;
  short: string;
  /** How a higher number reads for a buyer, used only for the caption. */
  higherIs: "better" | "worse" | "neither";
  format: (value: number) => string;
};

export type LeagueRow = {
  entityId: string;
  name: string;
  values: Record<string, number | null>;
  observations: number;
};

/**
 * Builds the table from one row set per metric.
 *
 * Communities appear when they have a price, because price is the spine of the
 * comparison; the other three are shown where published and left blank where
 * not, rather than being carried from another period to fill the cell.
 */
export function buildLeague(
  byMetric: Record<string, readonly MarketRow[]>,
  spine: string,
): LeagueRow[] {
  const index = new Map<string, LeagueRow>();
  for (const row of byMetric[spine] ?? []) {
    index.set(row.entity_id, {
      entityId: row.entity_id,
      name: row.name_en,
      values: { [spine]: row.metric_value },
      observations: row.observation_count,
    });
  }
  for (const [metric, rows] of Object.entries(byMetric)) {
    if (metric === spine) continue;
    for (const row of rows) {
      const found = index.get(row.entity_id);
      if (found) found.values[metric] = row.metric_value;
    }
  }
  /*
   * Yield after the service charge, derived from two published figures.
   *
   * This is the number the table exists for and the one nobody publishes.
   * Ranked on gross, Business Bay shows 5.8% and Al Hebiah Third 6.5%, and
   * the gap looks small. Business Bay carries a 27 AED service charge against
   * Al Hebiah Third's 8, so once the charge comes off, one keeps most of its
   * yield and the other does not. A gross yield table without this column
   * quietly recommends the wrong community.
   *
   * Still not net. Management, maintenance and the weeks a home sits empty
   * come off after this, and the column is labelled so nobody reads it as a
   * take-home figure.
   */
  for (const row of index.values()) {
    const rent = row.values["median_rent_per_sqft"];
    const price = row.values["median_price_per_sqft"];
    const charge = row.values["median_service_charge_sqft"];
    row.values["yield_after_charge_pct"] =
      rent != null && price != null && charge != null && price > 0
        ? Number((((rent - charge) / price) * 100).toFixed(2))
        : null;
  }

  return [...index.values()];
}

export function CommunityLeague({
  rows,
  columns,
  periodLabel,
  initialSort,
}: {
  rows: readonly LeagueRow[];
  columns: readonly LeagueColumn[];
  periodLabel: string;
  initialSort: string;
}) {
  const [sort, setSort] = useState(initialSort);
  const [descending, setDescending] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const left = a.values[sort];
      const right = b.values[sort];
      /* A community without this figure goes to the bottom whichever way the
       * column is pointing. Sorting a blank as zero would rank an unpublished
       * community as the cheapest place in Dubai. */
      if (left == null && right == null) return a.name.localeCompare(b.name);
      if (left == null) return 1;
      if (right == null) return -1;
      return descending ? right - left : left - right;
    });
    return copy;
  }, [rows, sort, descending]);

  if (rows.length === 0) return null;

  const toggle = (key: string) => {
    if (key === sort) {
      setDescending((value) => !value);
      return;
    }
    setSort(key);
    setDescending(true);
  };

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse">
          <caption className="sr-only">
            Dubai communities ranked on registered price, rent, gross yield and service charge for{" "}
            {periodLabel}. Select a column heading to reorder.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="eyebrow border-b border-border py-4 pe-6 text-start">
                Community
              </th>
              {columns.map((column) => {
                const active = sort === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (descending ? "descending" : "ascending") : "none"}
                    className="border-b border-border py-4 pe-6 text-end"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(column.key)}
                      className={cn(
                        "focus-ring eyebrow inline-flex min-h-9 items-center gap-1.5 transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="hidden sm:inline">{column.label}</span>
                      <span className="sm:hidden">{column.short}</span>
                      {active ? (
                        descending ? (
                          <ArrowDown aria-hidden className="size-3" />
                        ) : (
                          <ArrowUp aria-hidden className="size-3" />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.entityId} className="border-b border-border/60 hover:bg-cream">
                <th scope="row" className="py-3 pe-6 text-start font-normal">
                  <Link
                    to="/market-intelligence/communities/$id"
                    params={{ id: row.entityId }}
                    className="focus-ring caption transition-colors hover:text-gold-ink"
                  >
                    {row.name}
                  </Link>
                </th>
                {columns.map((column) => {
                  const value = row.values[column.key];
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "caption py-3 pe-6 text-end tabular-nums",
                        sort === column.key ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {value == null ? (
                        <span className="text-muted-foreground/60">not published</span>
                      ) : (
                        column.format(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="body-text mt-6 max-w-measure text-muted-foreground">
        Every community with enough registered activity to publish is here, in {periodLabel}, not
        a shortlist. A blank is a figure the registry did not publish for that community and
        period, not a zero.{" "}
        <strong className="font-normal text-foreground">
          The last column is gross yield with the service charge taken off, and it is the one worth
          sorting by.
        </strong>{" "}
        Ranked on gross alone, a community with a 27 AED charge can outrank one with an 8 AED
        charge and still leave an owner worse off. It is still not a take-home figure: management,
        maintenance and the weeks a home sits empty come off after this.
      </figcaption>
    </figure>
  );
}

/** The four columns, and how each one is written. */
export const LEAGUE_COLUMNS: readonly LeagueColumn[] = [
  {
    key: "median_price_per_sqft",
    label: "Price per sqft",
    short: "Price",
    higherIs: "neither",
    format: (value) => `AED ${Math.round(value).toLocaleString("en-AE")}`,
  },
  {
    key: "median_rent_per_sqft",
    label: "Rent per sqft",
    short: "Rent",
    higherIs: "neither",
    format: (value) => `AED ${Math.round(value).toLocaleString("en-AE")}`,
  },
  {
    key: "gross_rental_yield_pct",
    label: "Gross yield",
    short: "Yield",
    higherIs: "better",
    format: (value) => `${value.toFixed(2)}%`,
  },
  {
    key: "median_service_charge_sqft",
    label: "Service charge",
    short: "Charge",
    higherIs: "worse",
    format: (value) => `AED ${value.toFixed(0)}`,
  },
  {
    key: "yield_after_charge_pct",
    label: "After charge",
    short: "Net*",
    higherIs: "better",
    format: (value) => `${value.toFixed(2)}%`,
  },
] as const;
