/**
 * Server-side reads of the published DLD market aggregates.
 *
 * Only the five bounded public functions are called. The underlying tables and
 * the internal projection view are not readable by the site's key, so there is
 * no path here that could return more than a published, suppressed aggregate.
 * Every call degrades to an empty result rather than throwing, because a market
 * page with one missing series should still render the rest of itself.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  UNAVAILABLE_METADATA,
  clampCommunityIds,
  type MarketEntityType,
  type MarketGrain,
  type MarketMetadata,
  type MarketMetric,
  type MarketRow,
} from "./market-public";

type MarketDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      get_dld_market_overview: {
        Args: {
          requested_metrics: string[];
          requested_grain: string;
          from_date: string;
          to_date: string;
          result_limit?: number;
        };
        Returns: MarketRow[];
      };
      get_dld_market_entity_series: {
        Args: {
          requested_entity_type: string;
          requested_entity_id: string;
          requested_metric: string;
          requested_grain: string;
          from_date: string;
          to_date: string;
          result_limit?: number;
        };
        Returns: MarketRow[];
      };
      compare_dld_market_communities: {
        Args: {
          community_ids: string[];
          requested_metric: string;
          requested_grain: string;
          requested_period: string;
          result_limit?: number;
        };
        Returns: MarketRow[];
      };
      search_dld_market_entities: {
        Args: {
          query: string;
          requested_types?: string[];
          result_limit?: number;
          result_offset?: number;
        };
        Returns: MarketSearchRow[];
      };
      get_dld_community_leaderboard: {
        Args: {
          requested_metric: string;
          requested_grain: string;
          requested_period: string;
          sort_direction?: string;
          result_limit?: number;
        };
        Returns: MarketRow[];
      };
      get_dld_latest_period: {
        Args: {
          requested_entity_type: string;
          requested_metric: string;
          requested_grain: string;
        };
        Returns: string | null;
      };
      get_dld_market_metadata: {
        Args: Record<string, never>;
        Returns: {
          source_export_date: string | null;
          methodology_version: string | null;
          published_at: string | null;
          row_count: number;
        }[];
      };

    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type MarketSearchRow = {
  entity_type: MarketEntityType;
  entity_id: string;
  name_en: string;
  name_ar: string;
  source_export_date: string;
  methodology_version: string;
};

const marketDb = supabase as unknown as SupabaseClient<MarketDatabase>;

function normalise(rows: MarketRow[] | null): MarketRow[] {
  return (rows ?? []).map((row) => ({
    ...row,
    metric_value: Number(row.metric_value),
    observation_count: Number(row.observation_count),
    quality_flags: Array.isArray(row.quality_flags) ? row.quality_flags : [],
  }));
}

export async function getMarketMetadata(): Promise<MarketMetadata> {
  try {
    const { data, error } = await marketDb.rpc("get_dld_market_metadata", {});
    if (error) throw error;
    const row = data?.[0];
    if (!row || !row.source_export_date) return UNAVAILABLE_METADATA;
    return {
      sourceExportDate: row.source_export_date,
      methodologyVersion: row.methodology_version,
      publishedAt: row.published_at,
      rowCount: Number(row.row_count ?? 0),
    };
  } catch (error) {
    console.error("[data:dld-market] metadata unavailable", error);
    return UNAVAILABLE_METADATA;
  }
}

export async function getMarketOverview(input: {
  metrics: readonly MarketMetric[];
  grain: MarketGrain;
  from: string;
  to: string;
  limit?: number;
}): Promise<MarketRow[]> {
  try {
    const { data, error } = await marketDb.rpc("get_dld_market_overview", {
      requested_metrics: [...input.metrics].slice(0, 10),
      requested_grain: input.grain,
      from_date: input.from,
      to_date: input.to,
      result_limit: input.limit ?? 500,
    });
    if (error) throw error;
    return normalise(data);
  } catch (error) {
    console.error("[data:dld-market] overview unavailable", error);
    return [];
  }
}

export async function getMarketEntitySeries(input: {
  entityType: MarketEntityType;
  entityId: string;
  metric: MarketMetric;
  grain: MarketGrain;
  from: string;
  to: string;
  limit?: number;
}): Promise<MarketRow[]> {
  try {
    const { data, error } = await marketDb.rpc("get_dld_market_entity_series", {
      requested_entity_type: input.entityType,
      requested_entity_id: input.entityId,
      requested_metric: input.metric,
      requested_grain: input.grain,
      from_date: input.from,
      to_date: input.to,
      result_limit: input.limit ?? 200,
    });
    if (error) throw error;
    return normalise(data);
  } catch (error) {
    console.error("[data:dld-market] entity series unavailable", error);
    return [];
  }
}

export async function compareMarketCommunities(input: {
  communityIds: readonly string[];
  metric: MarketMetric;
  grain: MarketGrain;
  period: string;
}): Promise<MarketRow[]> {
  const ids = clampCommunityIds(input.communityIds);
  if (ids.length === 0) return [];
  try {
    const { data, error } = await marketDb.rpc("compare_dld_market_communities", {
      community_ids: ids,
      requested_metric: input.metric,
      requested_grain: input.grain,
      requested_period: input.period,
    });
    if (error) throw error;
    return normalise(data);
  } catch (error) {
    console.error("[data:dld-market] comparison unavailable", error);
    return [];
  }
}

export async function searchMarketEntities(input: {
  query: string;
  types?: readonly MarketEntityType[];
  limit?: number;
}): Promise<MarketSearchRow[]> {
  const query = input.query.trim();
  if (query.length === 0 || query.length > 100) return [];
  try {
    const { data, error } = await marketDb.rpc("search_dld_market_entities", {
      query,
      requested_types: [...(input.types ?? ["community", "project", "developer"])],
      result_limit: input.limit ?? 20,
      result_offset: 0,
    });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("[data:dld-market] entity search unavailable", error);
    return [];
  }
}

/**
 * Communities substantial enough to deserve an indexable page.
 *
 * The public functions deliberately have no "list everything" entry point, so
 * this reads the canonical table directly with the trusted server client. It is
 * used only to build the sitemap, and it applies a floor: a community with a
 * handful of published quarters is a thin page, and thin pages are worse than
 * absent ones.
 */
/**
 * Communities ranked on one metric, for one period.
 *
 * The published functions could say how Dubai is doing, how one community is
 * doing, and how a hand-picked twenty compare. None of them could answer the
 * question a buyer actually arrives with, which is where they should be
 * looking, because nothing could put the communities in order.
 */
export async function getCommunityLeaderboard(input: {
  metric: MarketMetric;
  grain: MarketGrain;
  period: string;
  direction?: "asc" | "desc";
  limit?: number;
}): Promise<MarketRow[]> {
  try {
    const { data, error } = await marketDb.rpc("get_dld_community_leaderboard", {
      requested_metric: input.metric,
      requested_grain: input.grain,
      requested_period: input.period,
      sort_direction: input.direction ?? "desc",
      result_limit: input.limit ?? 60,
    });
    if (error) throw error;
    return normalise(data);
  } catch (error) {
    console.error("[data:dld-market] leaderboard unavailable", error);
    return [];
  }
}

/**
 * The newest period that actually carries rows for a metric.
 *
 * Asked rather than assumed, because the price series and the count series do
 * not always land in the same quarter, and a page that guesses "this quarter"
 * renders an empty table the week before an export.
 */
export async function getLatestPeriod(input: {
  entityType: MarketEntityType;
  metric: MarketMetric;
  grain: MarketGrain;
}): Promise<string | null> {
  try {
    const { data, error } = await marketDb.rpc("get_dld_latest_period", {
      requested_entity_type: input.entityType,
      requested_metric: input.metric,
      requested_grain: input.grain,
    });
    if (error) throw error;
    return (data as unknown as string | null) ?? null;
  } catch (error) {
    console.error("[data:dld-market] latest period unavailable", error);
    return null;
  }
}

export async function listMarketCommunitiesServer(): Promise<
  { entityId: string; nameEn: string }[]
> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as unknown as SupabaseClient)
      .from("dld_market_aggregates")
      .select("entity_id,name_en")
      .eq("entity_type", "community")
      .eq("metric_code", "registered_sale_count")
      .eq("period_grain", "year")
      .gte("period_start", "2022-01-01")
      .limit(4000);
    if (error) throw error;

    const seen = new Map<string, { nameEn: string; years: number }>();
    for (const row of (data ?? []) as { entity_id: string; name_en: string }[]) {
      const found = seen.get(row.entity_id);
      if (found) found.years += 1;
      else seen.set(row.entity_id, { nameEn: row.name_en, years: 1 });
    }
    /* Three published years is the floor for a page worth crawling. */
    return [...seen.entries()]
      .filter(([, value]) => value.years >= 3)
      .map(([entityId, value]) => ({ entityId, nameEn: value.nameEn }));
  } catch (error) {
    console.error("[data:dld-market] community index unavailable", error);
    return [];
  }
}
