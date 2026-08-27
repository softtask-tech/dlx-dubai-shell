import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useAdminSession } from "./route";
import { campaignPerformanceFn, importSpendFn } from "@/data/admin.functions";
import type { RoasSummary } from "@/data/roas.server";
import { AUDIENCES } from "@/data/audiences";
import { pageHead } from "@/lib/seo";
import { TextArea } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { Tag } from "@/components/ui/tag";

/**
 * What the advertising returned.
 *
 * Built to be trusted, which means built to admit what it does not know. A
 * campaign with leads and no imported spend shows "-", not a zero; a campaign
 * with spend and no closed deal shows "return unknown", not "0×". Every row
 * carries the gaps that stopped it computing, because a marketing dashboard
 * that quietly fills holes with zeroes is how budgets get doubled on the
 * strength of an infinite return.
 */
export const Route = createFileRoute("/admin/roas")({
  head: () =>
    pageHead({
      path: "/admin/roas",
      title: "Return on ad spend",
      description: "DLX Properties internal administration.",
      tagline: "Internal only.",
      noIndex: true,
    }),
  component: RoasAdmin,
});

/** Default window: the last 30 days, which is how ad accounts are read. */
function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

const money = (value: number | null): string =>
  value === null ? "-" : `AED ${Math.round(value).toLocaleString("en-AE")}`;

function RoasAdmin() {
  const { accessToken } = useAdminSession();
  const [range, setRange] = useState(defaultRange);
  const [summary, setSummary] = useState<RoasSummary | null>(null);
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const result = await campaignPerformanceFn({
      data: { accessToken, from: range.from, to: range.to },
    });
    setSummary(result);
  }, [accessToken, range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function importSpend() {
    if (!accessToken || csv.trim().length === 0) return;
    setImporting(true);
    const result = await importSpendFn({ data: { accessToken, csv } });
    setImportResult(
      result.errors.length > 0
        ? `${result.imported} rows imported. ${result.errors.join(" · ")}`
        : `${result.imported} rows imported.`,
    );
    setImporting(false);
    setCsv("");
    await load();
  }

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Paid media</Eyebrow>
          <h1 className="display-2 mt-4">Return on ad spend</h1>
        </div>
        <div className="flex items-end gap-3">
          <label className="caption flex flex-col gap-2">
            From
            <input
              type="date"
              value={range.from}
              onChange={(event) => setRange((r) => ({ ...r, from: event.target.value }))}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="caption flex flex-col gap-2">
            To
            <input
              type="date"
              value={range.to}
              onChange={(event) => setRange((r) => ({ ...r, to: event.target.value }))}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      {summary ? (
        <>
          {/* Said once, at the top, because every figure below depends on it. */}
          {summary.spendMissing ? (
            <p className="body-text mt-8 border-l-2 border-accent pl-6 text-muted-foreground">
              No spend has been imported for this period, so cost per lead and return cannot be
              computed. Lead counts and quality below are still accurate, paste an export from your
              ad manager to complete the picture.
            </p>
          ) : null}

          <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Spend" value={money(summary.totalSpendAed)} />
            <Metric label="Leads" value={String(summary.totalLeads)} />
            <Metric label="Qualified" value={String(summary.totalQualified)} />
            <Metric label="Closed" value={String(summary.totalWon)} />
            <Metric
              label="Revenue"
              value={summary.totalRevenueAed > 0 ? money(summary.totalRevenueAed) : "-"}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Tag variant="soft">{summary.mix.hot} hot</Tag>
            <Tag variant="outline">{summary.mix.warm} warm</Tag>
            <Tag variant="bare">{summary.mix.cold} cold</Tag>
            {summary.unattributedLeads > 0 ? (
              <span className="caption text-muted-foreground">
                {summary.unattributedLeads} with no campaign, direct, organic, or attribution lost
              </span>
            ) : null}
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Campaign",
                    "Spend",
                    "Leads",
                    "Qualified",
                    "CPL",
                    "Cost / qualified",
                    "Closed",
                    "ROAS",
                  ].map((heading) => (
                    <th key={heading} className="eyebrow py-3 text-left text-muted-foreground">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.campaigns.map((row) => (
                  <tr
                    key={`${row.source}-${row.campaign}`}
                    className="border-b border-border/60 align-top"
                  >
                    <td className="py-4 pr-6">
                      <span className="block text-sm">{row.campaign}</span>
                      <span className="caption text-muted-foreground">{row.source}</span>
                      {row.gaps.length > 0 ? (
                        <span className="caption mt-2 block text-accent">
                          {row.gaps.join(" · ")}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 pr-6 text-sm">{money(row.spendAed)}</td>
                    <td className="py-4 pr-6 text-sm">{row.leads}</td>
                    <td className="py-4 pr-6 text-sm">{row.qualified}</td>
                    <td className="py-4 pr-6 text-sm">{money(row.costPerLeadAed)}</td>
                    <td className="py-4 pr-6 text-sm">{money(row.costPerQualifiedAed)}</td>
                    <td className="py-4 pr-6 text-sm">{row.won}</td>
                    <td className="py-4 text-sm">
                      {row.roas === null ? "-" : `${row.roas.toFixed(1)}×`}
                    </td>
                  </tr>
                ))}
                {summary.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-sm text-muted-foreground">
                      No leads in this period.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="body-text mt-10 text-muted-foreground">Loading…</p>
      )}

      <section className="mt-16 border-t border-border pt-10">
        <Eyebrow>Import spend</Eyebrow>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">
          Paste a CSV export from Meta or Google Ads. Header row must include{" "}
          <code>platform, campaign, date, spend</code>;{" "}
          <code>ad, impressions, clicks, conversions</code> are optional. Re-importing a day
          corrects it rather than doubling it.
        </p>
        <p className="caption mt-3 max-w-measure text-muted-foreground">
          Campaign names must match the <code>utm_campaign</code> your ads set, or spend and leads
          land in different rows and neither figure means anything.
        </p>

        <div className="mt-6 max-w-3xl">
          <TextArea
            rows={8}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            placeholder={"platform,campaign,date,spend\nmeta,summer-offplan,2026-08-01,4200"}
          />
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={() => void importSpend()} disabled={importing || !csv.trim()}>
              {importing ? "Importing…" : "Import"}
            </Button>
            {importResult ? (
              <span className="caption text-muted-foreground">{importResult}</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-border pt-10">
        <Eyebrow>Retargeting audiences</Eyebrow>
        <p className="body-text mt-4 max-w-measure text-muted-foreground">
          Build these in Ads Manager from the events the site fires. The definitions live in the
          codebase so a renamed event cannot silently stop an audience filling.
        </p>

        <div className="mt-8 grid gap-px bg-border md:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <div key={audience.name} className="bg-background p-6">
              <p className="lead">{audience.name}</p>
              <p className="caption mt-3 text-muted-foreground">{audience.purpose}</p>
              <dl className="mt-5">
                <div className="flex gap-4 border-t border-border/60 py-2">
                  <dt className="caption w-20 shrink-0 text-muted-foreground">Include</dt>
                  <dd className="caption">{audience.includes.join(", ")}</dd>
                </div>
                {audience.excludes.length > 0 ? (
                  <div className="flex gap-4 border-t border-border/60 py-2">
                    <dt className="caption w-20 shrink-0 text-muted-foreground">Exclude</dt>
                    <dd className="caption">{audience.excludes.join(", ")}</dd>
                  </div>
                ) : null}
                <div className="flex gap-4 border-t border-border/60 py-2">
                  <dt className="caption w-20 shrink-0 text-muted-foreground">Window</dt>
                  <dd className="caption">{audience.days} days</dd>
                </div>
                {audience.landingPage ? (
                  <div className="flex gap-4 border-t border-border/60 py-2">
                    <dt className="caption w-20 shrink-0 text-muted-foreground">Send to</dt>
                    <dd className="caption">{audience.landingPage}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="display-3 mt-3">{value}</p>
    </div>
  );
}
