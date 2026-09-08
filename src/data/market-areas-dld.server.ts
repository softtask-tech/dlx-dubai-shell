import type { AreaWithStats } from "./market-types";
import type { MarketRow } from "./market-public";

/**
 * The calculators' communities, built from the published aggregates.
 *
 * The tools took their figures from `areas.stats`, which is a different set of
 * numbers from the ones every other part of this site now publishes. That is
 * the same fault the advisor had: "best areas for rental income" could rank a
 * community on a yield that disagreed with the yield on that community's own
 * page and in the league table, and a visitor who checked would be right to
 * stop trusting both.
 *
 * It also explains the tools looking inert. `areas.stats` is filled by the
 * `sync-dld-data` job writing into an older table; the aggregate pipeline that
 * the market pages read is a separate thing entirely, so a calculator could sit
 * empty while the same figures were on screen two clicks away.
 *
 * So the calculators now read what the site publishes. Nothing in them
 * changed: this returns the `AreaWithStats` shape they already take, because a
 * calculator's job is arithmetic and rewriting seven of them to a new type
 * would risk their logic to fix their input.
 *
 * WHAT IS DELIBERATELY LEFT NULL. `average_price` and `average_price_per_sqft`,
 * because we publish medians and an average we did not compute is not a field
 * to fill in. `median_annual_rent`, because rent is published per square foot
 * and turning it into an annual figure needs a unit size — multiplying the
 * median of one distribution by the median of another gives a number that
 * looks precise and describes no actual home. `off_plan_share_pct`, until the
 * split function is migrated. Nothing reads any of them.
 */

/** Same quarter, previous year: the honest comparison for a seasonal market. */
function yearBefore(period: string): string | null {
  const match = /^(\d{4})(-\d{2}-\d{2})$/.exec(period);
  if (!match) return null;
  return `${Number(match[1]) - 1}${match[2]}`;
}

const change = (now: number | null, before: number | null): number | null =>
  now != null && before != null && before > 0
    ? Number((((now - before) / before) * 100).toFixed(1))
    : null;

export async function listDldAreasWithStats(): Promise<AreaWithStats[]> {
  try {
    const { getMarketMetadata, getCommunityLeaderboard, getLatestPeriod } = await import(
      "./market-public.server"
    );

    const [metadata, period] = await Promise.all([
      getMarketMetadata(),
      getLatestPeriod({
        entityType: "community",
        metric: "median_price_per_sqft",
        grain: "quarter",
      }),
    ]);
    if (!period || metadata.rowCount === 0) return [];

    const prior = yearBefore(period);

    const [prices, sales, yields, priorPrices] = await Promise.all([
      getCommunityLeaderboard({
        metric: "median_price_per_sqft",
        grain: "quarter",
        period,
        limit: 200,
      }),
      getCommunityLeaderboard({
        metric: "median_sale_price",
        grain: "quarter",
        period,
        limit: 200,
      }),
      getCommunityLeaderboard({
        metric: "gross_rental_yield_pct",
        grain: "quarter",
        period,
        limit: 200,
      }),
      prior
        ? getCommunityLeaderboard({
            metric: "median_price_per_sqft",
            grain: "quarter",
            period: prior,
            limit: 200,
          })
        : Promise.resolve([] as MarketRow[]),
    ]);

    const by = (rows: readonly MarketRow[]) => new Map(rows.map((row) => [row.entity_id, row]));
    const saleBy = by(sales);
    const yieldBy = by(yields);
    const priorBy = by(priorPrices);

    /* Price is the spine, as everywhere else, so a community appears in the
     * tools only when it appears in the league table. */
    return prices.map((row) => {
      const priorRow = priorBy.get(row.entity_id) ?? null;
      return {
        id: row.entity_id,
        /* The slug is an identity key inside the calculators — selection state
         * and lookups, never a URL — so the registry id serves, and no link
         * breaks by using it. */
        slug: row.entity_id,
        name: row.name_en,
        summary: null,
        description: null,
        hero_image_url: null,
        latitude: null,
        longitude: null,
        stats: {
          id: `dld:${row.entity_id}:${period}`,
          area_id: row.entity_id,
          provenance: "dld_open_data",
          window_start: row.period_start,
          window_end: row.period_end,
          transaction_count: row.observation_count,
          median_price: saleBy.get(row.entity_id)?.metric_value ?? null,
          average_price: null,
          median_price_per_sqft: row.metric_value,
          average_price_per_sqft: null,
          prior_transaction_count: priorRow?.observation_count ?? null,
          prior_median_price_per_sqft: priorRow?.metric_value ?? null,
          yoy_price_change_pct: change(row.metric_value, priorRow?.metric_value ?? null),
          yoy_volume_change_pct: change(
            row.observation_count,
            priorRow?.observation_count ?? null,
          ),
          median_annual_rent: null,
          gross_yield_pct: yieldBy.get(row.entity_id)?.metric_value ?? null,
          off_plan_share_pct: null,
          last_updated: metadata.sourceExportDate ?? row.period_end,
        },
      } satisfies AreaWithStats;
    });
  } catch (error) {
    console.error("[data:tools] could not build communities from published aggregates", error);
    return [];
  }
}
