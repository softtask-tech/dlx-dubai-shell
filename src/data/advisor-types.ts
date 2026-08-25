/**
 * The advisor tables, hand-declared.
 *
 * Same reason as `market-types.ts`: `src/integrations/supabase/types.ts` is
 * generated from the live project, and the Phase 5 migration has not been
 * pushed there yet. Field names match the columns one-for-one, so regenerating
 * and deleting this file is mechanical.
 */
import type { AdvisorTurn } from "./advisor";
import type { JsonObject } from "./types";

export type AdvisorChannelValue = "chat" | "voice";

export type AdvisorConversationRow = {
  id: string;
  channel: AdvisorChannelValue;
  session_token: string;
  language: string;
  transcript: AdvisorTurn[];
  summary: string | null;
  /* `JsonObject` rather than `Record<string, unknown>`: this row crosses the
   * server-function boundary to the admin app, and that boundary rejects
   * `unknown`, rightly, since anything crossing it has to be serializable. */
  qualification: JsonObject;
  lead_id: string | null;
  call_sid: string | null;
  call_seconds: number | null;
  caller_number: string | null;
  turn_count: number;
  ip_hash: string | null;
  started_at: string;
  last_turn_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdvisorDatabase = {
  public: {
    Tables: {
      advisor_conversations: {
        Row: AdvisorConversationRow;
        Insert: {
          channel: AdvisorChannelValue;
          session_token: string;
          language?: string;
          ip_hash?: string | null;
          call_sid?: string | null;
          caller_number?: string | null;
          transcript?: unknown;
          lead_id?: string | null;
        };
        Update: {
          transcript?: unknown;
          qualification?: unknown;
          turn_count?: number;
          language?: string;
          summary?: string | null;
          lead_id?: string | null;
          call_seconds?: number | null;
          caller_number?: string | null;
          last_turn_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { advisor_channel: AdvisorChannelValue };
    CompositeTypes: Record<never, never>;
  };
};
