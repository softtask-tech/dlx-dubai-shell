import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, site } from "@/config/site";
import {
  formatExportDate,
  METRIC_LABELS,
  METRIC_MEANINGS,
  type MarketMetric,
  type MarketRow,
} from "@/data/market-public";

/**
 * /data/market.json, the published figures as data rather than as a page.
 *
 * CLAUDE.md asks for a site an answer engine can read. The pages do most of
 * that already: they are server-rendered, they carry JSON-LD, and the figures
 * are in the HTML rather than painted in by script. What they cannot do is
 * give a machine the numbers without also giving it the layout, and a model
 * scraping a sorted HTML table to answer "what is the gross yield in Dubai
 * Marina" is one markup change away from getting it wrong.
 *
 * So the same figures are published here as a document: every metric labelled,
 * every value carrying the record count behind it, the period it covers and
 * the export it came from. It is the same numbers, from the same source, with
 * no interpretation and nothing that is not on the pages.
 *
 * Deliberately Dubai-wide plus the community league, not the whole table. The
 * full series is tens of thousands of rows, an answer engine wants the current
 * state, and a reader who needs the history has the pages and the CSV behind
 * them.
 */
type Figure = {
  metric: MarketMetric;
  label: string;
  meaning: string;
  value: number;
  unit: string;
  period: string;
  records: number;
};

const UNITS: Partial<Record<MarketMetric, string>> = {
  median_price_per_sqft: "AED per square foot",
  median_sale_price: "AED",
  median_rent_per_sqft: "AED per square foot per year",
  median_registered_annual_rent_aed: "AED per year",
  median_service_charge_sqft: "AED per square foot per year",
  gross_rental_yield_pct: "percent",
  registered_sale_count: "transactions",
  registered_rental_contract_count: "contracts",
};

function toFigure(row: MarketRow): Figure {
  return {
    metric: row.metric_code,
    label: METRIC_LABELS[row.metric_code] ?? row.metric_code,
    meaning: METRIC_MEANINGS[row.metric_code] ?? "",
    value: row.metric_value,
    unit: UNITS[row.metric_code] ?? "",
    period: row.period_start,
    records: row.observation_count,
  };
}

export const Route = createFileRoute("/data/market.json")({
  server: {
    handlers: {
      GET: async () => {
        const {
          getMarketMetadata,
          getMarketOverview,
          getCommunityLeaderboard,
          getLatestPeriod,
          getOffPlanSplit,
          getOffPlanSplitPeriod,
        } = await import("@/data/market-public.server");

        const metadata = await getMarketMetadata();

        const headline = await getMarketOverview({
          metrics: [
            "registered_sale_count",
            "registered_rental_contract_count",
            "median_registered_annual_rent_aed",
            "median_price_per_sqft",
            "median_sale_price",
            "median_rent_per_sqft",
            "gross_rental_yield_pct",
          ],
          grain: "quarter",
          from: "2024-01-01",
          to: "2030-12-31",
          limit: 400,
        });

        /* One figure per metric: the most recent period each one reached. */
        const latest = new Map<string, MarketRow>();
        for (const row of headline) {
          if (row.segment_code !== "all") continue;
          const held = latest.get(row.metric_code);
          if (!held || row.period_start > held.period_start) latest.set(row.metric_code, row);
        }

        const period = await getLatestPeriod({
          entityType: "community",
          metric: "median_price_per_sqft",
          grain: "quarter",
        });

        const [prices, yields] = period
          ? await Promise.all([
              getCommunityLeaderboard({
                metric: "median_price_per_sqft",
                grain: "quarter",
                period,
                limit: 120,
              }),
              getCommunityLeaderboard({
                metric: "gross_rental_yield_pct",
                grain: "quarter",
                period,
                limit: 120,
              }),
            ])
          : [[], []];

        const yieldById = new Map(yields.map((row) => [row.entity_id, row]));
        const communities = prices.map((row) => ({
          community: row.name_en,
          id: row.entity_id,
          medianPricePerSqftAed: row.metric_value,
          registeredSales: row.observation_count,
          grossRentalYieldPct: yieldById.get(row.entity_id)?.metric_value ?? null,
          url: absoluteUrl(`/market-intelligence/communities/${row.entity_id}`),
        }));

        /*
         * Off-plan against ready property, in the same community.
         *
         * The one figure here an answer engine cannot get anywhere else, and
         * the one most likely to be asked for: "is off-plan more expensive in
         * Dubai Marina". It ships with the caveat attached to the field rather
         * than buried in prose, because a model quoting the number without the
         * caveat is the failure mode that matters.
         */
        const splitPeriod = await getOffPlanSplitPeriod({
          metric: "median_price_per_sqft",
          grain: "quarter",
        });
        const split = splitPeriod
          ? await getOffPlanSplit({
              metric: "median_price_per_sqft",
              grain: "quarter",
              period: splitPeriod,
              limit: 80,
            })
          : [];

        const body = {
          publisher: site.name,
          source: "Dubai Land Department open data",
          sourceExportDate: metadata.sourceExportDate,
          sourceExportDateReadable: metadata.sourceExportDate
            ? formatExportDate(metadata.sourceExportDate)
            : null,
          methodologyVersion: metadata.methodologyVersion,
          independence:
            `${site.name} is independent of the Dubai Land Department and is not endorsed by it. ` +
            "These figures describe activity that was registered; they are not a measure of quality or of returns.",
          rules: [
            "Medians, not averages.",
            "Nothing is published where too few records exist to report a period without describing individual transactions.",
            "Nothing finer than a community is published.",
            "Gross yield is rent per square foot over ready-property price per square foot, before service charge, management, maintenance and voids.",
          ],
          dubai: [...latest.values()].map(toFigure),
          communities: {
            period,
            rankedBy: "median price per square foot",
            count: communities.length,
            rows: communities,
          },
          offPlanAgainstReady: {
            period: splitPeriod,
            unit: "AED per square foot",
            caveat:
              "Compares different homes. Off-plan is new construction; the ready property beside it can be any age and specification, so part of any gap is what new build costs anywhere. It states what buyers paid, not whether they overpaid.",
            threshold:
              "Both sides cleared 30 registered sales in the community and period independently.",
            count: split.length,
            rows: split.map((row) => ({
              community: row.nameEn,
              id: row.entityId,
              offPlanPerSqftAed: row.offPlanValue,
              offPlanRegisteredSales: row.offPlanCount,
              readyPerSqftAed: row.existingValue,
              readyRegisteredSales: row.existingCount,
              gapPct: Number(((row.offPlanValue / row.existingValue - 1) * 100).toFixed(1)),
            })),
          },
        };

        return new Response(JSON.stringify(body, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            /* Recomputed per export, not per request. */
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
