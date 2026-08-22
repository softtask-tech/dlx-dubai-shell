import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useAdminSession } from "./route";
import { marketDataStatusFn, recomputeStatsFn, triggerSyncFn } from "@/data/admin.functions";
import type { MarketDataStatus } from "@/data/market-admin.server";
import { humanise } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * The market data view.
 *
 * Answers three questions the desk actually has: is the site currently citing
 * real DLD data or showing sample figures, how stale is it, and did the last
 * sync work. Everything else is detail.
 */
export const Route = createFileRoute("/admin/data")({
  head: () =>
    pageHead({
      path: "/admin/data",
      title: "Market data",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: MarketDataAdmin,
});

function MarketDataAdmin() {
  const session = useAdminSession();
  const [status, setStatus] = useState<MarketDataStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStatus(await marketDataStatusFn({ data: { accessToken: session.accessToken } }));
    } catch (loadError) {
      console.error(loadError);
      setError("Could not read the data status.");
    }
  }, [session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runSync(dataset: "transactions" | "rents") {
    setBusy(dataset);
    setMessage(null);
    setError(null);
    try {
      const result = await triggerSyncFn({ data: { accessToken: session.accessToken, dataset } });
      if (result.ok) setMessage(result.message);
      else setError(result.message);
    } catch (syncError) {
      console.error(syncError);
      setError("The sync could not be started.");
    } finally {
      setBusy(null);
      await load();
    }
  }

  async function recompute() {
    setBusy("recompute");
    setMessage(null);
    setError(null);
    try {
      const result = await recomputeStatsFn({ data: { accessToken: session.accessToken } });
      setMessage(`Recomputed statistics for ${result.refreshed} communities.`);
    } catch (recomputeError) {
      console.error(recomputeError);
      setError("Could not recompute the statistics.");
    } finally {
      setBusy(null);
      await load();
    }
  }

  const total = (counts: MarketDataStatus["transactions"]) =>
    counts.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Data engine</Eyebrow>
          <h1 className="display-2 mt-4">Market data</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="ghost"
            onClick={() => void runSync("transactions")}
            disabled={busy !== null}
          >
            {busy === "transactions" ? "Syncing…" : "Sync transactions"}
          </Button>
          <Button variant="ghost" onClick={() => void runSync("rents")} disabled={busy !== null}>
            {busy === "rents" ? "Syncing…" : "Sync rents"}
          </Button>
          <Button onClick={() => void recompute()} disabled={busy !== null}>
            {busy === "recompute" ? "Recomputing…" : "Recompute stats"}
          </Button>
        </div>
      </div>

      {message ? <p className="caption mt-8 text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="caption mt-8 text-destructive">
          {error}
        </p>
      ) : null}

      {!status ? (
        <p className="eyebrow mt-12">Loading…</p>
      ) : (
        <>
          {/* The question that matters most */}
          <div className="mt-10 border border-border p-8">
            <Eyebrow>What the site is currently citing</Eyebrow>
            <p className="display-3 mt-4">
              {status.isOfficial
                ? "Dubai Land Department records"
                : status.areasWithStats > 0
                  ? "Illustrative sample data"
                  : "Nothing — no statistics computed"}
            </p>
            <p className="caption mt-4 max-w-measure">
              {status.isOfficial
                ? "Every market figure on the public site cites DLD, because the statistics are computed from DLD records."
                : status.areasWithStats > 0
                  ? "The public pages state plainly that these figures are illustrative and do not cite DLD. Import a DLD snapshot to switch that over — it happens automatically once real records are present."
                  : "Market bands and area pages are showing their empty states."}
            </p>
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <Figure
              label="Transactions"
              value={total(status.transactions).toLocaleString("en-AE")}
              detail={status.transactions
                .map(
                  (entry) => `${entry.count.toLocaleString("en-AE")} ${humanise(entry.provenance)}`,
                )
                .join(" · ")}
            />
            <Figure
              label="Rent contracts"
              value={total(status.rentContracts).toLocaleString("en-AE")}
              detail={status.rentContracts
                .map(
                  (entry) => `${entry.count.toLocaleString("en-AE")} ${humanise(entry.provenance)}`,
                )
                .join(" · ")}
            />
            <Figure
              label="Communities covered"
              value={`${status.areasWithStats} / ${status.areasTotal}`}
              detail="With computed statistics"
            />
            <Figure
              label="Statistics updated"
              value={
                status.statsLastUpdated
                  ? new Date(status.statsLastUpdated).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Never"
              }
              detail={
                status.newestTransactionDate
                  ? `Newest record ${new Date(status.newestTransactionDate).toLocaleDateString("en-GB")}`
                  : "No records held"
              }
            />
          </div>

          <div className="mt-14">
            <Eyebrow>Recent runs</Eyebrow>
            {status.recentRuns.length === 0 ? (
              <p className="body-text mt-6 text-muted-foreground">
                No ingestion has run yet. The scheduled sync posts to the <code>sync-dld-data</code>{" "}
                function twice a day once Dubai Pulse credentials are configured.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[48rem] border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Started",
                        "Dataset",
                        "Trigger",
                        "Fetched",
                        "Stored",
                        "Rejected",
                        "Status",
                      ].map((heading) => (
                        <th key={heading} className="eyebrow py-4 pr-6 text-left font-normal">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {status.recentRuns.map((run) => (
                      <tr key={run.id} className="border-b border-border/60 align-top">
                        <td className="caption py-4 pr-6 whitespace-nowrap">
                          {new Date(run.started_at).toLocaleString("en-GB")}
                        </td>
                        <td className="caption py-4 pr-6">{run.dataset ?? "—"}</td>
                        <td className="caption py-4 pr-6">{humanise(run.trigger_source)}</td>
                        <td className="caption py-4 pr-6">{run.rows_fetched}</td>
                        <td className="caption py-4 pr-6">{run.rows_upserted}</td>
                        <td className="caption py-4 pr-6">{run.rows_rejected}</td>
                        <td className="py-4 pr-6">
                          <Tag variant={run.status === "succeeded" ? "soft" : "outline"}>
                            {run.status}
                          </Tag>
                          {run.error_message ? (
                            <p className="caption mt-2 max-w-sm text-destructive">
                              {run.error_message}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Container>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p className="display-3 mt-3">{value}</p>
      <p className="caption mt-2">{detail || "—"}</p>
    </div>
  );
}
