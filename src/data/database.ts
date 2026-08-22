/**
 * A `Database` shape for the Supabase client, covering the DLX tables.
 *
 * `src/integrations/supabase/types.ts` is generated from the live project and
 * is still empty, which types every `.from("properties")` call as `never`. This
 * module fills the gap using the row types in `./types`, so queries and inserts
 * are checked today. When the migrations reach the project and that file is
 * regenerated, delete this and point `db` at the generated `Database`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type {
  Agent,
  Area,
  Developer,
  Lead,
  LeadNote,
  Project,
  Property,
  Testimonial,
} from "./types";

/**
 * What an insert looks like: everything the database fills in is optional, and
 * `Required` names the columns the caller must provide.
 */
type Insertable<Row, Required extends keyof Row = never> = Partial<
  Omit<Row, "id" | "created_at" | "updated_at">
> &
  Pick<Row, Required>;

/** Updates never touch the identity or timestamp columns. */
type Updatable<Row> = Partial<Omit<Row, "id" | "created_at" | "updated_at">>;

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Insertable<Row, Required>;
  Update: Updatable<Row>;
  Relationships: [];
};

export type DlxDatabase = {
  public: {
    Tables: {
      areas: Table<Area, "slug" | "name">;
      developers: Table<Developer, "slug" | "name">;
      agents: Table<Agent, "slug" | "full_name">;
      projects: Table<Project, "slug" | "name">;
      properties: Table<Property, "slug" | "title" | "listing_type" | "property_type">;
      testimonials: Table<Testimonial, "author_name" | "quote">;
      leads: Table<Lead, "source_type">;
      lead_notes: Table<LeadNote, "lead_id" | "body">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/**
 * The publishable-key client, typed against the schema above.
 *
 * Row-level security still decides what comes back, so this is safe to use in
 * route loaders on both the server and the client: the public sees published
 * rows, an authenticated admin sees everything.
 */
export const db = supabase as unknown as SupabaseClient<DlxDatabase>;
