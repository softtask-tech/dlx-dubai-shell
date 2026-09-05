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
