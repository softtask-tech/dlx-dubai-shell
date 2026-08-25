/**
 * The service-role client, typed against the DLX schema.
 *
 * Server-only. The underlying client bypasses row-level security, so this must
 * never be reachable from a route file or anything that ships to the browser,
 * hence the dynamic import and the `.server.ts` suffix.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { DlxDatabase } from "./database";

/** Resolves the admin client. Only call this inside a server function. */
export async function adminDb(): Promise<SupabaseClient<DlxDatabase>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient<DlxDatabase>;
}
