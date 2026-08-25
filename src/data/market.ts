/**
 * Market data queries.
 *
 * Reads only from our own cleaned tables, never from Dubai Pulse at request
 * time. The pipeline's job is to keep these tables current; the site's job is
 * to render them fast.
 *
 * Like the other public queries these degrade to empty rather than throwing:
 * a market band that cannot load should leave the page intact.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { withFallback } from "./resilience";
import type {
  AreaPricePoint,
  AreaStats,
  AreaWithStats,
  DldTransaction,
  MarketDatabase,
  SourceAttribution,
} from "./market-types";

/*
 * The Phase 3 tables are newer than the generated types, so this client is
 * typed against the declarations in `market-types.ts` instead. Same connection,
 * same row-level security, only the type parameter differs.
 */
const market = supabase as unknown as SupabaseClient<MarketDatabase>;

export async function listAreasWithStats(): Promise<AreaWithStats[]> {
  return withFallback(runListAreasWithStats, [], "listAreasWithStats");
}

async function runListAreasWithStats(): Promise<AreaWithStats[]> {
  const { data, error } = await market
    .from("areas")
    .select(
      "id, slug, name, summary, description, hero_image_url, latitude, longitude, stats:area_stats (*)",
    )
    .order("name");

  if (error) throw error;

  /* PostgREST resolves the embed at runtime from the real foreign key; the
   * client cannot infer its shape without relationship metadata we do not
   * hand-write, so the row is shaped here instead. */
  const rows = (data ?? []) as unknown as (Omit<AreaWithStats, "stats"> & {
    stats: AreaStats[] | AreaStats | null;
  })[];

  /* PostgREST returns an embedded one-to-many as an array even when the foreign
   * key is unique, so flatten it to the single row it always is. */
  return rows.map((row) => ({
    ...row,
    stats: Array.isArray(row.stats) ? (row.stats[0] ?? null) : row.stats,
  }));
}

export async function getAreaWithStats(slug: string): Promise<AreaWithStats | null> {
  return withFallback(() => runGetAreaWithStats(slug), null, "getAreaWithStats");
}

async function runGetAreaWithStats(slug: string): Promise<AreaWithStats | null> {
  const { data, error } = await market
    .from("areas")
    .select(
      "id, slug, name, summary, description, hero_image_url, latitude, longitude, stats:area_stats (*)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Omit<AreaWithStats, "stats"> & {
    stats: AreaStats[] | AreaStats | null;
  };
  return { ...row, stats: Array.isArray(row.stats) ? (row.stats[0] ?? null) : row.stats };
}

/** The monthly series behind an area's chart, oldest first. */
export async function getAreaPriceHistory(areaId: string, months = 36): Promise<AreaPricePoint[]> {
  return withFallback(() => runGetAreaPriceHistory(areaId, months), [], "getAreaPriceHistory");
}

async function runGetAreaPriceHistory(areaId: string, months: number): Promise<AreaPricePoint[]> {
  const { data, error } = await market
    .from("area_price_history")
    .select("period_month, transaction_count, median_price_per_sqft, median_price")
    .eq("area_id", areaId)
    .order("period_month", { ascending: true })
    .limit(months)
    .returns<AreaPricePoint[]>();

  if (error) throw error;
  return data ?? [];
}

/**
 * The whole market as one monthly series, for the homepage chart.
 *
 * Summed and re-medianed across communities would be wrong, a median of
 * medians is not a median. This takes the volume-weighted mean of each month's
 * community medians, which is a defensible city-level index and is described on
 * the page as exactly that.
 */
export async function getMarketPriceIndex(months = 36): Promise<AreaPricePoint[]> {
  return withFallback(() => runGetMarketPriceIndex(months), [], "getMarketPriceIndex");
}

async function runGetMarketPriceIndex(months: number): Promise<AreaPricePoint[]> {
  const { data, error } = await market
    .from("area_price_history")
    .select("period_month, transaction_count, median_price_per_sqft, median_price")
    .order("period_month", { ascending: true })
    .returns<AreaPricePoint[]>();

  if (error) throw error;

  const byMonth = new Map<string, { weighted: number; volume: number; price: number }>();
  for (const point of data ?? []) {
    if (point.median_price_per_sqft === null) continue;
    const bucket = byMonth.get(point.period_month) ?? { weighted: 0, volume: 0, price: 0 };
    bucket.weighted += point.median_price_per_sqft * point.transaction_count;
    bucket.price += (point.median_price ?? 0) * point.transaction_count;
    bucket.volume += point.transaction_count;
    byMonth.set(point.period_month, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([period_month, bucket]) => ({
      period_month,
      transaction_count: bucket.volume,
      median_price_per_sqft: bucket.volume > 0 ? bucket.weighted / bucket.volume : null,
      median_price: bucket.volume > 0 ? bucket.price / bucket.volume : null,
    }));
}

/** The most recent recorded sales, for the ticker. */
export async function listRecentTransactions(limit = 12): Promise<DldTransaction[]> {
  return withFallback(() => runListRecentTransactions(limit), [], "listRecentTransactions");
}

async function runListRecentTransactions(limit: number): Promise<DldTransaction[]> {
  const { data, error } = await market
    .from("dld_transactions")
    .select(
      "id, provenance, transaction_date, property_type, registration_type, area_name_raw, area_id, building_name, bedrooms, amount, area_sqft, price_per_sqft",
    )
    .order("transaction_date", { ascending: false })
    .limit(limit)
    .returns<DldTransaction[]>();

  if (error) throw error;
  return data ?? [];
}

export type MarketSummary = {
  areasCovered: number;
  transactionCount: number;
  medianPricePerSqft: number | null;
  yoyPriceChangePct: number | null;
  bestYield: { areaName: string; yieldPct: number } | null;
  attribution: SourceAttribution;
};

/**
 * The handful of numbers the homepage leads with.
 *
 * Computed from the stored per-area statistics rather than from transactions,
 * so the homepage costs one small query however large the dataset grows.
 */
export async function getMarketSummary(): Promise<MarketSummary> {
  const areas = await listAreasWithStats();
  const withStats = areas.filter(
    (area): area is AreaWithStats & { stats: AreaStats } => area.stats !== null,
  );

  if (withStats.length === 0) {
    return {
      areasCovered: 0,
      transactionCount: 0,
      medianPricePerSqft: null,
      yoyPriceChangePct: null,
      bestYield: null,
      attribution: attributionFor(null, null),
    };
  }

  const transactionCount = withStats.reduce(
    (total, area) => total + area.stats.transaction_count,
    0,
  );

  /* Weighted by volume: a community with 800 sales says more about the city
   * than one with 12, and an unweighted mean would let the quiet one shout. */
  let weightedPpsf = 0;
  let weightedYoy = 0;
  let ppsfVolume = 0;
  let yoyVolume = 0;

  for (const area of withStats) {
    if (area.stats.median_price_per_sqft !== null) {
      weightedPpsf += area.stats.median_price_per_sqft * area.stats.transaction_count;
      ppsfVolume += area.stats.transaction_count;
    }
    if (area.stats.yoy_price_change_pct !== null) {
      weightedYoy += area.stats.yoy_price_change_pct * area.stats.transaction_count;
      yoyVolume += area.stats.transaction_count;
    }
  }

  const yielded = withStats
    .filter((area) => area.stats.gross_yield_pct !== null)
    .sort((a, b) => (b.stats.gross_yield_pct ?? 0) - (a.stats.gross_yield_pct ?? 0));

  const best = yielded[0];

  return {
    areasCovered: withStats.length,
    transactionCount,
    medianPricePerSqft: ppsfVolume > 0 ? weightedPpsf / ppsfVolume : null,
    yoyPriceChangePct: yoyVolume > 0 ? weightedYoy / yoyVolume : null,
    bestYield: best
      ? { areaName: best.name, yieldPct: best.stats.gross_yield_pct as number }
      : null,
    attribution: attributionFor(
      withStats[0]?.stats.provenance ?? null,
      withStats.reduce<string | null>(
        (latest, area) =>
          latest === null || area.stats.last_updated > latest ? area.stats.last_updated : latest,
        null,
      ),
    ),
  };
}

/**
 * Turns stored provenance into the line the page is allowed to print.
 *
 * The `sample` wording is deliberately unambiguous. A visitor must never come
 * away believing an illustrative figure was published by the Dubai Land
 * Department, and DLX must never imply an affiliation it does not have.
 */
export function attributionFor(
  provenance: string | null,
  updatedAt: string | null,
): SourceAttribution {
  if (provenance === "dld_open_data") {
    return { label: "Source: Dubai Land Department", isOfficial: true, updatedAt };
  }
  if (provenance === "sample") {
    return {
      label: "Illustrative sample data, not Dubai Land Department records",
      isOfficial: false,
      updatedAt,
    };
  }
  return { label: "No market data loaded yet", isOfficial: false, updatedAt };
}
