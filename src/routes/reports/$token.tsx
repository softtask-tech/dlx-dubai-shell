import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { site } from "@/config/site";
import {
  attributionFor,
  getAreaPriceHistory,
  getAreaWithStats,
  getMarketSummary,
  listAreasWithStats,
} from "@/data/market";
import type { AreaPricePoint, AreaWithStats, SourceAttribution } from "@/data/market-types";
import { formatMonth } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { TrendChart } from "@/components/market/trend-chart";
import { VerdictCard } from "@/components/market/verdict-card";
import { Button } from "@/components/ui/button";
import { Section, Container, Eyebrow } from "@/components/ui/section";

/**
 * Validates the token server-side and records the view.
 *
 * The check has to run on the server: the grant table is unreadable from the
 * browser by design, since it maps tokens to leads.
 */
const openReportFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(8) }).parse(data))
  .handler(async ({ data }): Promise<{ valid: boolean; areaSlug: string | null }> => {
    const { redeemReportGrant } = await import("@/data/reports.server");
    const result = await redeemReportGrant(data.token);
    return result.valid
      ? { valid: true, areaSlug: result.areaSlug }
      : { valid: false, areaSlug: null };
  });

export const Route = createFileRoute("/reports/$token")({
  loader: async ({ params }) => {
    /*
     * A token that cannot be redeemed, expired, unknown, or the grant store
     * being unreachable, is a "this link is not valid" page, never a 500. The
     * reader gave us their details for this; the worst outcome is an error
     * screen that makes them think it was a trick.
     */
    const grant = await openReportFn({ data: { token: params.token } }).catch((error: unknown) => {
      console.error("[reports] could not redeem token", error);
      return { valid: false as const, areaSlug: null };
    });
    if (!grant.valid) return { valid: false as const };

    const summary = await getMarketSummary();

    if (grant.areaSlug) {
      const area = await getAreaWithStats(grant.areaSlug);
      if (area) {
        const history = await getAreaPriceHistory(area.id);
        return { valid: true as const, kind: "area" as const, area, history, summary };
      }
    }

    const areas = await listAreasWithStats();
    return { valid: true as const, kind: "market" as const, areas, summary };
  },
  head: () =>
    pageHead({
      path: "/reports",
      title: "Market report",
      description: "A DLX Properties market report.",
      tagline: "Prepared for you.",
      image: "/og/market-intelligence.png",
      /* A gated document has no business in a search index. */
      noIndex: true,
    }),
  component: ReportPage,
});

function ReportPage() {
  const data = Route.useLoaderData();

  if (!data.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-measure text-center">
          <Eyebrow>Link not valid</Eyebrow>
          <h1 className="display-2 mt-6">This report link has expired.</h1>
          <p className="body-text mt-6 text-muted-foreground">
            Report links stay live for thirty days. Request a fresh one and it will be with you
            straight away.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild>
              <Link to="/market-intelligence">Request the report</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return data.kind === "area" ? (
    <AreaReport area={data.area} history={data.history} attribution={data.summary.attribution} />
  ) : (
    <MarketReport areas={data.areas} attribution={data.summary.attribution} />
  );
}

/**
 * The report shell.
 *
 * Designed to print. "Download PDF" is the browser's own print-to-PDF rather
 * than a server-rendered document: it keeps the report a living page that can
 * be updated, avoids shipping a PDF toolchain to the edge, and produces a file
 * that is selectable and searchable rather than a picture of a page. The print
 * stylesheet drops the navigation and the button itself.
 */
function ReportShell({
  eyebrow,
  title,
  standfirst,
  attribution,
  children,
}: {
  eyebrow: string;
  title: string;
  standfirst: string;
  attribution: SourceAttribution;
  children: React.ReactNode;
}) {
  return (
    <div className="report">
      <Section className="pt-32 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-3xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display-1 mt-6">{title}</h1>
            <p className="lead mt-8 text-muted-foreground">{standfirst}</p>
          </div>
          <div className="report-actions flex flex-col items-start gap-4">
            <Button onClick={() => window.print()}>Download as PDF</Button>
            <p className="caption max-w-[16rem]">
              Prints to a clean document. The link stays live for thirty days.
            </p>
          </div>
        </div>
        <FreshnessStamp attribution={attribution} className="mt-10" />
      </Section>

      {children}

      <Section flush className="border-t border-border py-10">
        <Container>
          <p className="caption">
            Prepared by {site.name} · RERA ORN {site.reraOrn} · {site.address.street},{" "}
            {site.address.locality}. {site.name} is not affiliated with the Dubai Land Department.
            This report is information, not personal advice.
          </p>
        </Container>
      </Section>
    </div>
  );
}

function AreaReport({
  area,
  history,
  attribution,
}: {
  area: AreaWithStats;
  history: readonly AreaPricePoint[];
  attribution: SourceAttribution;
}) {
  const stats = area.stats;

  return (
    <ReportShell
      eyebrow="Community report"
      title={`${area.name}`}
      standfirst={`What ${area.name} has actually transacted at over the last twelve months, what it returns in rent, and what we would pay here.`}
      attribution={attribution}
    >
      <Section className="pt-0">
        <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <ReportFigure
            label="Median price"
            value={
              stats?.median_price_per_sqft
                ? `AED ${Math.round(stats.median_price_per_sqft).toLocaleString("en-AE")}`
                : "-"
            }
            unit="per sq ft"
          />
          <ReportFigure
            label="Typical sale"
            value={
              stats?.median_price ? `AED ${(stats.median_price / 1_000_000).toFixed(2)}M` : "-"
            }
            unit="median"
          />
          <ReportFigure
            label="Year on year"
            value={
              stats?.yoy_price_change_pct !== null && stats?.yoy_price_change_pct !== undefined
                ? `${stats.yoy_price_change_pct >= 0 ? "+" : ""}${stats.yoy_price_change_pct.toFixed(1)}%`
                : "-"
            }
            unit="price per sq ft"
          />
          <ReportFigure
            label="Gross yield"
            value={stats?.gross_yield_pct ? `${stats.gross_yield_pct.toFixed(1)}%` : "Not shown"}
            unit="before service charges"
          />
        </dl>

        {stats ? (
          <p className="body-text mt-10 max-w-measure text-muted-foreground">
            Drawn from {stats.transaction_count.toLocaleString("en-AE")} recorded sales between{" "}
            {formatMonth(stats.window_start)} and {formatMonth(stats.window_end)}
            {stats.prior_transaction_count
              ? `, compared with ${stats.prior_transaction_count.toLocaleString("en-AE")} in the twelve months before that`
              : ""}
            .
          </p>
        ) : null}
      </Section>

      {history.length >= 2 ? (
        <Section className="pt-0">
          <Eyebrow>Three years of movement</Eyebrow>
          <TrendChart points={history} className="mt-8" height={300} />
        </Section>
      ) : null}

      <Section className="pt-0">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <VerdictCard areaName={area.name} stats={stats} />
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Eyebrow>What we would do</Eyebrow>
            <p className="body-text mt-6 text-muted-foreground">
              The figures tell you what the market has done. What they cannot tell you is which
              building, which floor, or which seller is motivated, and in {area.name} that is
              usually the difference between a good purchase and an average one.
            </p>
            <p className="body-text mt-5 text-muted-foreground">
              If you are considering buying here, a twenty-minute call will be worth more than
              another chart.
            </p>
            <Link to="/contact" className="eyebrow link-underline mt-8 inline-block text-accent">
              Speak to a consultant
            </Link>
          </div>
        </div>
      </Section>
    </ReportShell>
  );
}

function MarketReport({
  areas,
  attribution,
}: {
  areas: readonly AreaWithStats[];
  attribution: SourceAttribution;
}) {
  const covered = areas.filter((area) => area.stats !== null);

  return (
    <ReportShell
      eyebrow="Market report"
      title="Dubai residential market"
      standfirst="Every community we cover, what it transacted at, what it returns, and where the evidence points."
      attribution={attribution}
    >
      <Section className="pt-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {[
                "Community",
                "Median /sq ft",
                "Typical sale",
                "Year on year",
                "Gross yield",
                "Sales",
              ].map((heading) => (
                <th key={heading} className="eyebrow py-4 pr-6 text-left font-normal">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {covered.map((area) => (
              <tr key={area.id} className="border-b border-border/60">
                <td className="body-text py-4 pr-6">{area.name}</td>
                <td className="caption py-4 pr-6">
                  {area.stats?.median_price_per_sqft
                    ? `AED ${Math.round(area.stats.median_price_per_sqft).toLocaleString("en-AE")}`
                    : "-"}
                </td>
                <td className="caption py-4 pr-6">
                  {area.stats?.median_price
                    ? `AED ${(area.stats.median_price / 1_000_000).toFixed(2)}M`
                    : "-"}
                </td>
                <td className="caption py-4 pr-6">
                  {area.stats?.yoy_price_change_pct !== null &&
                  area.stats?.yoy_price_change_pct !== undefined
                    ? `${area.stats.yoy_price_change_pct >= 0 ? "+" : ""}${area.stats.yoy_price_change_pct.toFixed(1)}%`
                    : "-"}
                </td>
                <td className="caption py-4 pr-6">
                  {area.stats?.gross_yield_pct ? `${area.stats.gross_yield_pct.toFixed(1)}%` : "-"}
                </td>
                <td className="caption py-4 pr-6">{area.stats?.transaction_count ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="body-text mt-10 max-w-measure text-muted-foreground">
          Yields are gross: a year's registered rent against the typical sale price, before service
          charges. In Dubai those charges vary enough by building that a headline yield can be
          misleading on its own. We will model the net figure for a specific property on request.
        </p>
      </Section>

      <Section className="pt-0">
        <Eyebrow>Next step</Eyebrow>
        <p className="lead mt-6 max-w-3xl">
          Numbers narrow the field. Choosing within it is the part we are actually paid for.
        </p>
        <Link to="/contact" className="eyebrow link-underline mt-8 inline-block text-accent">
          Speak to a consultant
        </Link>
      </Section>
    </ReportShell>
  );
}

function ReportFigure({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-background p-8">
      <dt className="eyebrow">{label}</dt>
      <dd className="display-3 mt-3">{value}</dd>
      <dd className="caption mt-2">{unit}</dd>
    </div>
  );
}
