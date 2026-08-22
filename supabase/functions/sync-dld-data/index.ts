/**
 * sync-dld-data — keeps the market tables current.
 *
 * Runs on a schedule and can be triggered by hand from the admin data view.
 * The shape of a run:
 *
 *   authenticate (OAuth, cached token) → fetch a page of records → clean and
 *   validate → upsert → repeat → resolve community names → recompute the
 *   statistics → log what happened.
 *
 * Two properties matter more than speed here.
 *
 * The site never waits on Dubai Pulse. Pages read our own cleaned tables, so
 * the source being slow, rate-limited or down is an ingestion problem rather
 * than an outage. If a run fails, yesterday's figures stay up with an honest
 * "last updated" stamp on them.
 *
 * And a run is idempotent. Every row upserts on its source identifier, so
 * re-running after a partial failure corrects rather than duplicates — which
 * matters because a duplicated sale would quietly bias a median.
 *
 * Environment:
 *   DUBAI_PULSE_CLIENT_ID / DUBAI_PULSE_CLIENT_SECRET — register at
 *     https://www.dubaipulse.gov.ae for DLD dataset access
 *   DUBAI_PULSE_TOKEN_URL / DUBAI_PULSE_API_BASE — endpoints, overridable
 *     because the portal has moved them before
 *   DLD_SYNC_SECRET — shared secret the scheduler and the admin trigger present
 * Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { cleanRentRow, cleanTransactionRow, type CleanResult } from "./clean.ts";

const TOKEN_URL =
  Deno.env.get("DUBAI_PULSE_TOKEN_URL") ?? "https://www.dubaipulse.gov.ae/api/oauth/token";
const API_BASE = Deno.env.get("DUBAI_PULSE_API_BASE") ?? "https://www.dubaipulse.gov.ae/api";

const PAGE_SIZE = 1000;
/* A ceiling per run, so one invocation cannot run past the function timeout.
 * The next scheduled run continues from where this one stopped. */
const MAX_PAGES = 25;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Dataset = "transactions" | "rents";

const DATASETS: Record<
  Dataset,
  {
    path: string;
    table: string;
    conflict: string;
    clean: (row: Record<string, unknown>) => CleanResult<Record<string, unknown>>;
    dateField: string;
  }
> = {
  transactions: {
    path: "/dld/transactions",
    table: "dld_transactions",
    conflict: "provenance,source_transaction_id",
    clean: cleanTransactionRow,
    dateField: "instance_date",
  },
  rents: {
    path: "/dld/rent_contracts",
    table: "dld_rent_contracts",
    conflict: "provenance,source_contract_id",
    clean: cleanRentRow,
    dateField: "contract_start_date",
  },
};

/**
 * A cached access token.
 *
 * Held in module scope, which survives between invocations while the isolate is
 * warm. Refreshed a minute before expiry rather than on a 401, so a run never
 * loses a page to an avoidable retry.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const clientId = Deno.env.get("DUBAI_PULSE_CLIENT_ID");
  const clientSecret = Deno.env.get("DUBAI_PULSE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "Dubai Pulse credentials are not configured. Set DUBAI_PULSE_CLIENT_ID and DUBAI_PULSE_CLIENT_SECRET.",
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Dubai Pulse token request failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Dubai Pulse returned no access token.");

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function fetchPage(
  dataset: Dataset,
  token: string,
  offset: number,
  since: string | null,
): Promise<Record<string, unknown>[]> {
  const config = DATASETS[dataset];
  const url = new URL(`${API_BASE}${config.path}`);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  /* Incremental by default: only records newer than what we already hold. */
  if (since) url.searchParams.set(`${config.dateField}_from`, since);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Dubai Pulse ${dataset} request failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json();
  /* The portal has returned both a bare array and a wrapped object. */
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  /* The function is on a public URL; a shared secret keeps it from being an
   * open invitation to hammer Dubai Pulse on our credentials. */
  const expectedSecret = Deno.env.get("DLD_SYNC_SECRET");
  const providedSecret = request.headers.get("x-dld-sync-secret");
  if (expectedSecret && providedSecret !== expectedSecret) {
    return Response.json({ error: "Unauthorised" }, { status: 401, headers: corsHeaders });
  }

  const body = (await request.json().catch(() => ({}))) as {
    dataset?: Dataset;
    trigger?: string;
    full?: boolean;
  };
  const dataset: Dataset = body.dataset === "rents" ? "rents" : "transactions";
  const config = DATASETS[dataset];

  const { data: run } = await supabase
    .from("dld_ingest_runs")
    .insert({
      status: "running",
      trigger_source: body.trigger ?? "scheduled",
      dataset,
    })
    .select("id")
    .single();

  const runId = run?.id as string | undefined;
  let fetched = 0;
  let upserted = 0;
  let rejected = 0;
  const rejections: Record<string, number> = {};

  try {
    const token = await getAccessToken();

    /* Where to resume from: the newest record we already hold, less a few days
     * of overlap because DLD backfills late registrations. Upserting makes the
     * overlap free. */
    let since: string | null = null;
    if (!body.full) {
      const { data: newest } = await supabase
        .from(config.table)
        .select(dataset === "transactions" ? "transaction_date" : "contract_start_date")
        .eq("provenance", "dld_open_data")
        .order(dataset === "transactions" ? "transaction_date" : "contract_start_date", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      const latest = newest
        ? ((newest as Record<string, string>)[
            dataset === "transactions" ? "transaction_date" : "contract_start_date"
          ] ?? null)
        : null;

      if (latest) {
        const overlap = new Date(latest);
        overlap.setDate(overlap.getDate() - 7);
        since = overlap.toISOString().slice(0, 10);
      }
    }

    for (let page = 0; page < MAX_PAGES; page++) {
      const records = await fetchPage(dataset, token, page * PAGE_SIZE, since);
      if (records.length === 0) break;
      fetched += records.length;

      const rows: Record<string, unknown>[] = [];
      for (const record of records) {
        const result = config.clean(record);
        if (result.ok) {
          rows.push(result.row);
        } else {
          rejected += 1;
          rejections[result.reason] = (rejections[result.reason] ?? 0) + 1;
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from(config.table)
          .upsert(rows, { onConflict: config.conflict });
        if (error) throw new Error(`Upsert failed: ${error.message}`);
        upserted += rows.length;
      }

      /* A short page means the end of the dataset. */
      if (records.length < PAGE_SIZE) break;
    }

    /* Resolve community names, then recompute everything the site reads. */
    await supabase.rpc("link_transactions_to_areas");
    const { data: refreshed } = await supabase.rpc("refresh_area_stats");

    if (runId) {
      await supabase
        .from("dld_ingest_runs")
        .update({
          status: "succeeded",
          finished_at: new Date().toISOString(),
          rows_fetched: fetched,
          rows_upserted: upserted,
          rows_rejected: rejected,
          areas_refreshed: typeof refreshed === "number" ? refreshed : 0,
        })
        .eq("id", runId);
    }

    return Response.json(
      { ok: true, dataset, fetched, upserted, rejected, rejections },
      { headers: corsHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[sync-dld-data]", message);

    if (runId) {
      await supabase
        .from("dld_ingest_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          rows_fetched: fetched,
          rows_upserted: upserted,
          rows_rejected: rejected,
          error_message: message,
        })
        .eq("id", runId);
    }

    /* 200 with ok:false: the caller is a scheduler, and the run is recorded.
     * A 500 here would only produce a retry storm against the same failure. */
    return Response.json({ ok: false, dataset, error: message }, { headers: corsHeaders });
  }
});
