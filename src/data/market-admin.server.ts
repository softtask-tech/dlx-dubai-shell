/**
 * The market data view's server side.
 *
 * Admin-only: the ingestion history and the manual re-sync both sit behind the
 * same role check as the rest of the admin app.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { DataProvenance, IngestRun, MarketAdminDatabase } from "./market-types";

/** The service-role client, typed against the market tables. */
async function marketAdminDb(): Promise<SupabaseClient<MarketAdminDatabase>> {
  return (await adminDb()) as unknown as SupabaseClient<MarketAdminDatabase>;
}

export type ProvenanceCount = { provenance: DataProvenance; count: number };

export type MarketDataStatus = {
  transactions: ProvenanceCount[];
  rentContracts: ProvenanceCount[];
  areasWithStats: number;
  areasTotal: number;
  statsLastUpdated: string | null;
  /** True when the site is currently citing the Dubai Land Department. */
  isOfficial: boolean;
  newestTransactionDate: string | null;
  recentRuns: IngestRun[];
};

export async function getMarketDataStatus(): Promise<MarketDataStatus> {
  const supabase = await marketAdminDb();

  const [transactions, rents, areas, stats, newest, runs] = await Promise.all([
    supabase.from("dld_transactions").select("provenance"),
    supabase.from("dld_rent_contracts").select("provenance"),
    supabase.from("areas").select("id"),
    supabase.from("area_stats").select("provenance, last_updated"),
    supabase
      .from("dld_transactions")
      .select("transaction_date")
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("dld_ingest_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const tally = (rows: { provenance: DataProvenance }[] | null): ProvenanceCount[] => {
    const counts = new Map<DataProvenance, number>();
    for (const row of rows ?? []) counts.set(row.provenance, (counts.get(row.provenance) ?? 0) + 1);
    return [...counts.entries()].map(([provenance, count]) => ({ provenance, count }));
  };

  const statRows = (stats.data ?? []) as { provenance: DataProvenance; last_updated: string }[];

  return {
    transactions: tally(transactions.data),
    rentContracts: tally(rents.data),
    areasWithStats: statRows.length,
    areasTotal: (areas.data ?? []).length,
    statsLastUpdated: statRows.reduce<string | null>(
      (latest, row) => (latest === null || row.last_updated > latest ? row.last_updated : latest),
      null,
    ),
    isOfficial: statRows.some((row) => row.provenance === "dld_open_data"),
    newestTransactionDate: newest.data?.transaction_date ?? null,
    recentRuns: (runs.data ?? []) as IngestRun[],
  };
}

/**
 * Fires an ingestion run by hand.
 *
 * Calls the same Edge Function the scheduler does, so a manual run is not a
 * second code path that can behave differently from the nightly one.
 */
export async function triggerSync(
  dataset: "transactions" | "rents",
): Promise<{ ok: boolean; message: string }> {
  const supabase = await marketAdminDb();

  const { data, error } = await supabase.functions.invoke("sync-dld-data", {
    body: { dataset, trigger: "manual" },
    headers: { "x-dld-sync-secret": process.env["DLD_SYNC_SECRET"] ?? "" },
  });

  if (error) return { ok: false, message: error.message ?? "The sync could not be started." };
  if (data && data.ok === false) {
    return { ok: false, message: String(data.error ?? "The sync reported a failure.") };
  }

  return {
    ok: true,
    message: data
      ? `Fetched ${data.fetched ?? 0}, stored ${data.upserted ?? 0}, rejected ${data.rejected ?? 0}.`
      : "Sync started.",
  };
}

/** Recomputes the metrics without re-fetching, useful after a manual import. */
export async function recomputeStats(): Promise<number> {
  const supabase = await marketAdminDb();
  await supabase.rpc("link_transactions_to_areas");
  const { data, error } = await supabase.rpc("refresh_area_stats");
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : 0;
}
