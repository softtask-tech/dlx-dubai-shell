/**
 * Gated market reports, server side only.
 *
 * The gate is a token, not a guessable URL: submitting the qualified form
 * creates a `report_grants` row and returns its token, and the report route
 * refuses to render without one that is valid and unexpired.
 *
 * Grants are deliberately generous, thirty days, unlimited views. The point of
 * the gate is to know who asked, not to make the reader fight for something
 * they already gave us their details for. A report that cannot be reopened next
 * week is a report that gets screenshotted instead of revisited.
 */
import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { MarketAdminDatabase } from "./market-types";

/** The service-role client, typed against the grant store. */
async function grantsDb(): Promise<SupabaseClient<MarketAdminDatabase>> {
  return (await adminDb()) as unknown as SupabaseClient<MarketAdminDatabase>;
}

const GRANT_DAYS = 30;

export type ReportGrant = {
  token: string;
  areaSlug: string | null;
  expiresAt: string;
};

/** Issues a grant for a lead. `areaSlug` null means the whole-market report. */
export async function createReportGrant(
  leadId: string | null,
  areaSlug: string | null,
): Promise<ReportGrant> {
  const client = await grantsDb();

  let areaId: string | null = null;
  if (areaSlug) {
    const { data } = await client.from("areas").select("id").eq("slug", areaSlug).maybeSingle();
    areaId = data?.id ?? null;
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + GRANT_DAYS * 86_400_000).toISOString();

  const { error } = await client.from("report_grants").insert({
    token,
    lead_id: leadId,
    area_id: areaId,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Could not issue the report: ${error.message}`);

  return { token, areaSlug, expiresAt };
}

export type GrantCheck =
  { valid: true; areaSlug: string | null } | { valid: false; reason: "unknown" | "expired" };

/**
 * Validates a token and records the view.
 *
 * The view count is what tells the desk whether a report was actually read, a
 * lead who opened it three times is a different conversation from one who never
 * opened it at all.
 */
export async function redeemReportGrant(token: string): Promise<GrantCheck> {
  const client = await grantsDb();

  const { data, error } = await client
    .from("report_grants")
    .select("id, expires_at, view_count, first_viewed_at, area:areas (slug)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { valid: false, reason: "unknown" };

  /* Same reason as the market queries: the embedded area is resolved by
   * PostgREST, not inferred by the client. */
  const grant = data as unknown as {
    id: string;
    expires_at: string;
    view_count: number | null;
    first_viewed_at: string | null;
    area: { slug: string } | null;
  };

  if (new Date(grant.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }

  await client
    .from("report_grants")
    .update({
      view_count: (grant.view_count ?? 0) + 1,
      first_viewed_at: grant.first_viewed_at ?? new Date().toISOString(),
    })
    .eq("id", grant.id);

  return { valid: true, areaSlug: grant.area?.slug ?? null };
}
