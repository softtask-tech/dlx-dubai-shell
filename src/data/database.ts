/**
 * The publishable-key client, typed against the generated schema.
 *
 * The schema now exists in the project, so `src/integrations/supabase/types.ts`
 * is authoritative and the hand-written stand-in that used to live here is
 * gone. Row-level security still decides what comes back, so this is safe to
 * use in route loaders on both the server and the client: the public sees
 * published rows, an authenticated admin sees everything.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type DlxDatabase = Database;

export const db = supabase as unknown as SupabaseClient<Database>;
