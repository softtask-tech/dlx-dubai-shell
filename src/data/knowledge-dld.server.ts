import {
  formatExportDate,
  formatPeriod,
  METRIC_LABELS,
  type MarketMetric,
  type MarketRow,
} from "./market-public";
import type { KnowledgeEntry } from "./knowledge";

/**
 * The published DLD figures, as things the advisor is allowed to say.
 *
 * This closes a gap that mattered. The advisor's market knowledge came from
 * `areas.stats` — an older table whose provenance column marks some rows as
 * illustrative — while the website published a completely separate set of
 * figures out of `dld_market_aggregates`. So the page could say a community
 * costs AED 1,379 a square foot and the advisor, asked the same question in
 * the same minute, could answer from a different number entirely. An advisor
 * that contradicts the page it sits on is worse than no advisor: it does not
 * just fail to help, it withdraws the trust the page just earned.
 *
 * So the advisor now reads the same published aggregates the site reads, from
 * the same bounded public functions. That is the whole design:
 *
 *   - It cannot reach a project, a building or an individual contract, because
 *     the functions it calls cannot.
 *   - It cannot quote a metric the scope registry has not opened, because the
 *     gate runs inside the function rather than here.
 *   - It cannot cite a figure the site would refuse to publish, because it is
 *     literally the same call the page makes.
 *
 * Feeding the advisor new data therefore means publishing it. There is no
 * second pipeline to keep in step, which is the only version of this that
 * stays true a year from now.
 *
 * Every entry carries the record count and the period, because a figure
 * without them invites the advisor to state it more firmly than it deserves.
 */

const aed = (value: number) => `AED ${Math.round(value).toLocaleString("en-AE")}`;

/** How each metric reads in a sentence a person would say out loud. */
function phrase(metric: MarketMetric, value: number): string {
  switch (metric) {
    case "median_price_per_sqft":
      return `${aed(value)} per square foot`;
    case "median_rent_per_sqft":
      return `${aed(value)} per square foot a year in rent`;
    case "median_sale_price":
      return `${aed(value)} for the middle registered sale`;
    case "median_registered_annual_rent_aed":
      return `${aed(value)} a year for the middle registered tenancy`;
    case "median_service_charge_sqft":
      return `${aed(value)} per square foot a year in service charge`;
    case "gross_rental_yield_pct":
      return `${value.toFixed(2)}% gross rental yield`;
    default:
      return `${Math.round(value).toLocaleString("en-AE")} ${METRIC_LABELS[metric].toLowerCase()}`;
  }
}

/**
 * Dubai as a whole: the handful of figures most questions actually want.
 *
 * One entry rather than one per metric, because "what are prices doing in
 * Dubai" is a single question and retrieval that returns six fragments of an
 * answer makes the advisor assemble it, which is when it starts improvising.
 */
export function dubaiEntry(
  latest: readonly MarketRow[],
  exportDate: string | null,
): KnowledgeEntry | null {
  if (latest.length === 0) return null;

  const lines = latest.map(
    (row) =>
      `${METRIC_LABELS[row.metric_code]}: ${phrase(row.metric_code, row.metric_value)} ` +
      `(${row.observation_count.toLocaleString("en-AE")} records, ${formatPeriod("quarter", row.period_start)}).`,
  );

  const price = latest.find((row) => row.metric_code === "median_price_per_sqft");
  const yieldRow = latest.find((row) => row.metric_code === "gross_rental_yield_pct");

  return {
    id: "dld:dubai",
    kind: "market",
    title: "Dubai market figures, from the registry",
    questions: [
      "What are property prices in Dubai?",
      "What is the average price per square foot in Dubai?",
      "What yield does Dubai property give?",
      "How is the Dubai property market doing?",
      "What does a property in Dubai cost?",
    ],
    answer:
      price && yieldRow
        ? `Across Dubai the middle registered sale was ${phrase("median_price_per_sqft", price.metric_value)}, ` +
          `and registered rents against ready-property prices imply a ${yieldRow.metric_value.toFixed(2)}% gross yield ` +
          `before the service charge. Both come from what was actually registered with the Dubai Land Department, ` +
          `not from asking prices.`
        : "Registered figures for Dubai, taken from Dubai Land Department open data.",
    body: [
      ...lines,
      "These are medians, not averages: half of what was registered sat below each figure and half above.",
      "Gross yield is rent per square foot over ready-property price per square foot. It is before the service charge, management, maintenance and the weeks a home sits empty.",
    ],
    url: "/market-intelligence",
    source: exportDate
      ? `Source: Dubai Land Department open data, export ${formatExportDate(exportDate)}. DLX Properties is independent of the Dubai Land Department and is not endorsed by it.`
      : "Source: Dubai Land Department open data.",
    ...(exportDate ? { updatedAt: exportDate } : {}),
    /* No verification line: these are published records, not a rule that
     * changes underneath the reader. */
    requiresVerification: false,
    routeToHuman: false,
    tags: ["market", "dld", "Dubai", "prices", "yield"],
  };
}

/** One community, with every published figure the league table shows. */
export function communityEntry(input: {
  entityId: string;
  name: string;
  values: Record<string, number | null>;
  observations: number;
  period: string;
  exportDate: string | null;
}): KnowledgeEntry | null {
  const { name, values } = input;
  const price = values["median_price_per_sqft"];
  if (price == null) return null;

  const body: string[] = [
    `Median registered price: ${phrase("median_price_per_sqft", price)} (${input.observations.toLocaleString("en-AE")} registered sales, ${formatPeriod("quarter", input.period)}).`,
  ];

  const rent = values["median_rent_per_sqft"];
  if (rent != null) body.push(`Median registered rent: ${phrase("median_rent_per_sqft", rent)}.`);

  const gross = values["gross_rental_yield_pct"];
  if (gross != null) body.push(`Gross rental yield: ${gross.toFixed(2)}%, before the service charge.`);

  const charge = values["median_service_charge_sqft"];
  if (charge != null) {
    body.push(`Service charge: ${phrase("median_service_charge_sqft", charge)}.`);
  }

  const after = values["yield_after_charge_pct"];
  if (after != null) {
    body.push(
      `Yield after the service charge comes off: ${after.toFixed(2)}%. Still not take-home — management, maintenance and void periods come off after this.`,
    );
  }

  /* Said plainly, because it is the single most common way a yield figure gets
   * misread and the advisor will be asked to compare communities on it. */
  if (gross != null && after == null) {
    body.push(
      "The service charge for this community is not published, so the yield above cannot be adjusted for it. Two communities on the same gross yield can differ by more than a point once their charges come off.",
    );
  }

  return {
    id: `dld:community:${input.entityId}`,
    kind: "market",
    title: `${name} registered figures`,
    questions: [
      `What are prices like in ${name}?`,
      `What does property cost in ${name}?`,
      `What yield does ${name} give?`,
      `What is the service charge in ${name}?`,
      `Is ${name} a good place to buy?`,
    ],
    answer:
      `In ${name} the middle registered sale was ${phrase("median_price_per_sqft", price)}` +
      (gross != null ? `, on a ${gross.toFixed(2)}% gross yield` : "") +
      (after != null ? ` and ${after.toFixed(2)}% once the service charge comes off` : "") +
      `. From ${input.observations.toLocaleString("en-AE")} sales registered with the Dubai Land Department in ${formatPeriod("quarter", input.period)}.`,
    body,
    url: `/market-intelligence/communities/${input.entityId}`,
    source: input.exportDate
      ? `Source: Dubai Land Department open data, export ${formatExportDate(input.exportDate)}.`
      : "Source: Dubai Land Department open data.",
    ...(input.exportDate ? { updatedAt: input.exportDate } : {}),
    requiresVerification: false,
    /*
     * Always to a human.
     *
     * A community median is a fact about a quarter, not advice about a
     * purchase, and the gap between the two is where somebody loses money. The
     * advisor may state every figure above; whether this community suits this
     * buyer is a consultant's answer.
     */
    routeToHuman: true,
    tags: ["market", "dld", name, "prices", "yield", "service charge"],
  };
}

/**
 * Builds the DLD half of the knowledge index.
 *
 * Degrades to an empty list rather than throwing. An advisor that answers from
 * guides and listings while the market rows are briefly unavailable is a far
 * better outcome than one that fails to load at all — and every one of these
 * calls already returns `[]` on error, so a bad export empties this quietly.
 */
export async function buildDldKnowledge(): Promise<KnowledgeEntry[]> {
  try {
    const { getMarketMetadata, getMarketOverview, getCommunityLeaderboard, getLatestPeriod } =
      await import("./market-public.server");

    const metadata = await getMarketMetadata();
    if (metadata.rowCount === 0) return [];

    const DUBAI_METRICS: MarketMetric[] = [
      "median_price_per_sqft",
      "median_sale_price",
      "median_rent_per_sqft",
      "gross_rental_yield_pct",
      "registered_sale_count",
      "registered_rental_contract_count",
    ];
    const COMMUNITY_METRICS: MarketMetric[] = [
      "median_price_per_sqft",
      "median_rent_per_sqft",
      "gross_rental_yield_pct",
    ];

    const [overview, period, chargePeriod] = await Promise.all([
      getMarketOverview({
        metrics: DUBAI_METRICS,
        grain: "quarter",
        from: "2024-01-01",
        to: "2030-12-31",
        limit: 400,
      }),
      getLatestPeriod({
        entityType: "community",
        metric: "median_price_per_sqft",
        grain: "quarter",
      }),
      getLatestPeriod({
        entityType: "community",
        metric: "median_service_charge_sqft",
        grain: "year",
      }),
    ]);

    /* One row per metric: the most recent period each one reached. */
    const latest = new Map<string, MarketRow>();
    for (const row of overview) {
      if (row.segment_code !== "all") continue;
      const held = latest.get(row.metric_code);
      if (!held || row.period_start > held.period_start) latest.set(row.metric_code, row);
    }

    const entries: KnowledgeEntry[] = [];
    const dubai = dubaiEntry([...latest.values()], metadata.sourceExportDate);
    if (dubai) entries.push(dubai);

    if (!period) return entries;

    const [byMetric, charges] = await Promise.all([
      Promise.all(
        COMMUNITY_METRICS.map(async (metric) => {
          const rows = await getCommunityLeaderboard({
            metric,
            grain: "quarter",
            period,
            limit: 200,
          });
          return [metric, rows] as const;
        }),
      ),
      chargePeriod
        ? getCommunityLeaderboard({
            metric: "median_service_charge_sqft",
            grain: "year",
            period: chargePeriod,
            limit: 200,
          })
        : Promise.resolve([] as MarketRow[]),
    ]);

    /* Joined on a price spine, the same way the league table does it, so the
     * advisor and the page cannot disagree about which communities exist. */
    const index = new Map<
      string,
      { name: string; values: Record<string, number | null>; observations: number }
    >();
    for (const [metric, rows] of byMetric) {
      for (const row of rows) {
        const held = index.get(row.entity_id);
        if (held) {
          held.values[metric] = row.metric_value;
        } else if (metric === "median_price_per_sqft") {
          index.set(row.entity_id, {
            name: row.name_en,
            values: { [metric]: row.metric_value },
            observations: row.observation_count,
          });
        }
      }
    }
    for (const row of charges) {
      const held = index.get(row.entity_id);
      if (held) held.values["median_service_charge_sqft"] = row.metric_value;
    }

    for (const [entityId, held] of index) {
      const rent = held.values["median_rent_per_sqft"];
      const price = held.values["median_price_per_sqft"];
      const charge = held.values["median_service_charge_sqft"];
      held.values["yield_after_charge_pct"] =
        rent != null && price != null && charge != null && price > 0
          ? Number((((rent - charge) / price) * 100).toFixed(2))
          : null;

      const entry = communityEntry({
        entityId,
        name: held.name,
        values: held.values,
        observations: held.observations,
        period,
        exportDate: metadata.sourceExportDate,
      });
      if (entry) entries.push(entry);
    }

    return entries;
  } catch (error) {
    console.error("[advisor] could not build DLD knowledge", error);
    return [];
  }
}
