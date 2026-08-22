/**
 * Market data shapes.
 *
 * Hand-declared for the Phase 3 tables until the generated types catch up with
 * the migration. Field names match the columns one-for-one.
 */

/** Where a figure came from. The site's source line is derived from this. */
export type DataProvenance = "dld_open_data" | "sample";

export type AreaStats = {
  id: string;
  area_id: string;
  provenance: DataProvenance;
  window_start: string;
  window_end: string;
  transaction_count: number;
  median_price: number | null;
  average_price: number | null;
  median_price_per_sqft: number | null;
  average_price_per_sqft: number | null;
  prior_transaction_count: number | null;
  prior_median_price_per_sqft: number | null;
  yoy_price_change_pct: number | null;
  yoy_volume_change_pct: number | null;
  median_annual_rent: number | null;
  gross_yield_pct: number | null;
  off_plan_share_pct: number | null;
  last_updated: string;
};

export type AreaPricePoint = {
  period_month: string;
  transaction_count: number;
  median_price_per_sqft: number | null;
  median_price: number | null;
};

export type DldTransaction = {
  id: string;
  provenance: DataProvenance;
  transaction_date: string;
  property_type: string | null;
  registration_type: string | null;
  area_name_raw: string;
  area_id: string | null;
  building_name: string | null;
  bedrooms: number | null;
  amount: number;
  area_sqft: number | null;
  price_per_sqft: number | null;
};

/** An area with its statistics attached, which is how the pages want it. */
export type AreaWithStats = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  stats: AreaStats | null;
};

export type IngestRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  trigger_source: string;
  dataset: string | null;
  rows_fetched: number;
  rows_upserted: number;
  rows_rejected: number;
  areas_refreshed: number;
  error_message: string | null;
};

/**
 * What the site is allowed to say about where its numbers came from.
 *
 * Derived from the provenance stored alongside the data, never from a constant
 * — so the attribution cannot drift away from what is actually in the table.
 */
export type SourceAttribution = {
  /** The line printed beneath a figure. */
  label: string;
  /** True only when the figures really are Dubai Land Department records. */
  isOfficial: boolean;
  /** When the metrics were last recomputed. */
  updatedAt: string | null;
};

/**
 * A schema for the Phase 3 tables, so the market queries are type-checked.
 *
 * The generated types in `src/integrations/supabase/types.ts` are regenerated
 * from the live project and do not yet include these tables. Field names match
 * the migration one-for-one, so this can be deleted once the generated file
 * catches up.
 */
/** The area columns the market pages read. */
export type AreaRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ReadOnlyTable<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type MarketDatabase = {
  public: {
    Tables: {
      areas: ReadOnlyTable<AreaRow>;
      area_stats: ReadOnlyTable<AreaStats>;
      area_price_history: ReadOnlyTable<AreaPricePoint & { id: string; area_id: string }>;
      dld_transactions: ReadOnlyTable<DldTransaction>;
      dld_ingest_runs: ReadOnlyTable<IngestRun>;
    };
    Views: Record<string, never>;
    Functions: {
      /** Recomputes every community's statistics. Returns the number refreshed. */
      refresh_area_stats: { Args: Record<string, never>; Returns: number };
      /** Resolves DLD community names to our own area rows. */
      link_transactions_to_areas: { Args: Record<string, never>; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** The market tables plus the grant store, for server-side code. */
export type MarketAdminDatabase = {
  public: MarketDatabase["public"] & {
    Tables: MarketDatabase["public"]["Tables"] & {
      dld_rent_contracts: {
        Row: { id: string; provenance: DataProvenance };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      report_grants: {
        Row: {
          id: string;
          token: string;
          lead_id: string | null;
          area_id: string | null;
          expires_at: string;
          first_viewed_at: string | null;
          view_count: number;
        };
        Insert: {
          token: string;
          lead_id?: string | null;
          area_id?: string | null;
          expires_at: string;
        };
        Update: { view_count?: number; first_viewed_at?: string | null };
        Relationships: [];
      };
    };
  };
};
