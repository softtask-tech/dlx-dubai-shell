/**
 * The Phase 6 tables, hand-declared.
 *
 * Same reason as `market-types.ts` and `advisor-types.ts`: the generated
 * Supabase types come from the live project and this migration has not been
 * pushed there yet. Field names match the columns one-for-one.
 */
import type { JsonObject } from "./types";

export type ConversionDestination = "meta_capi" | "google_ads" | "ga4";
export type ConversionStatus = "pending" | "sent" | "failed" | "skipped";

export type ConversionEventRow = {
  id: string;
  lead_id: string | null;
  destination: ConversionDestination;
  event_name: string;
  event_id: string;
  value_aed: number | null;
  status: ConversionStatus;
  attempts: number;
  response: JsonObject | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignSpendRow = {
  id: string;
  platform: string;
  campaign_id: string;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  spend_date: string;
  spend_aed: number;
  impressions: number | null;
  clicks: number | null;
  platform_conversions: number | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
};

export type PaidMediaDatabase = {
  public: {
    Tables: {
      conversion_events: {
        Row: ConversionEventRow;
        Insert: {
          lead_id?: string | null;
          destination: ConversionDestination;
          event_name: string;
          event_id: string;
          value_aed?: number | null;
          status?: ConversionStatus;
        };
        Update: {
          status?: ConversionStatus;
          attempts?: number;
          response?: unknown;
          error?: string | null;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      /*
       * `leads` gains Phase 6 columns the generated types have not caught up
       * with. Declared permissively rather than restated in full: the columns
       * are the ones in the migration, and the allow-list that actually
       * protects this table is the Zod schema in `leads.server.ts`.
       */
      leads: {
        Row: Record<string, unknown> & { id: string };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      campaign_spend: {
        Row: CampaignSpendRow;
        Insert: {
          platform: string;
          campaign_id: string;
          campaign_name?: string | null;
          adset_id?: string | null;
          adset_name?: string | null;
          ad_id?: string | null;
          ad_name?: string | null;
          spend_date: string;
          spend_aed: number;
          impressions?: number | null;
          clicks?: number | null;
          platform_conversions?: number | null;
        };
        Update: {
          spend_aed?: number;
          impressions?: number | null;
          clicks?: number | null;
          platform_conversions?: number | null;
          campaign_name?: string | null;
          ad_name?: string | null;
          imported_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      conversion_destination: ConversionDestination;
      conversion_status: ConversionStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
