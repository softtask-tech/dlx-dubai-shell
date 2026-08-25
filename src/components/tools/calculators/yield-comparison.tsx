import { useState } from "react";

import { Assumptions, CalculatorLayout, Headline } from "../calculator-shell";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { attributionFor } from "@/data/market";
import type { AreaWithStats } from "@/data/market-types";
import { Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Compare communities side by side.
 *
 * Only communities we hold recorded evidence for appear. A comparison is only
 * as good as the thinnest column in it, so a community with too few sales is
 * left out rather than padded in with a shaky median.
 */
export function YieldComparison({ areas }: { areas: readonly AreaWithStats[] }) {
  const covered = areas.filter((area) => area.stats?.median_price_per_sqft);
  const [selected, setSelected] = useState<string[]>(() =>
    covered.slice(0, 3).map((area) => area.slug),
  );

  const chosen = covered.filter((area) => selected.includes(area.slug));
  const attribution = attributionFor(
    covered[0]?.stats?.provenance ?? null,
    covered[0]?.stats?.last_updated ?? null,
  );

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug],
    );
  }

  const bestYield = chosen.reduce<AreaWithStats | null>(
    (best, area) =>
      (area.stats?.gross_yield_pct ?? 0) > (best?.stats?.gross_yield_pct ?? 0) ? area : best,
    null,
  );

  if (covered.length === 0) {
    return (
      <div className="border border-border p-12 text-center">
        <Eyebrow>No data yet</Eyebrow>
        <h3 className="display-3 mt-6">Community data is loading.</h3>
        <p className="body-text mx-auto mt-6 max-w-measure text-muted-foreground">
          Once recorded transactions are in, this tool compares communities on price, yield and
          movement.
        </p>
      </div>
    );
  }

  return (
    <CalculatorLayout
      inputs={
        <fieldset className="flex flex-col gap-3">
          <legend className="eyebrow mb-2">Choose communities</legend>
          {covered.map((area) => (
            <label key={area.id} className="flex cursor-pointer items-center gap-4">
              <input
                type="checkbox"
                checked={selected.includes(area.slug)}
                onChange={() => toggle(area.slug)}
                className="h-4 w-4 accent-accent"
              />
              <span className="body-text">{area.name}</span>
            </label>
          ))}
          <p className="caption mt-3">
            Only communities with enough recorded sales to compare honestly are listed.
          </p>
        </fieldset>
      }
      result={
        chosen.length === 0 ? (
          <p className="body-text text-muted-foreground">Pick a community to compare.</p>
        ) : (
          <>
            <Headline
              label="Best gross yield of those chosen"
              value={
                <span className="display-2">
                  {bestYield?.stats?.gross_yield_pct
                    ? `${bestYield.stats.gross_yield_pct.toFixed(1)}%`
                    : "-"}
                </span>
              }
              meaning={
                bestYield?.stats?.gross_yield_pct
                  ? `${bestYield.name} returns the most rent against price of those selected. Gross, before service charges, which vary enough by building to change the order.`
                  : "We hold no registered tenancy contracts for the communities selected, so no yield is shown."
              }
              tone="neutral"
            />

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["Community", "Median /sq ft", "Gross yield", "Year on year", "Sales"].map(
                      (heading) => (
                        <th key={heading} className="eyebrow py-4 pe-6 text-start font-normal">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chosen.map((area) => (
                    <tr key={area.id} className="border-b border-border/60">
                      <td className="body-text py-4 pe-6">{area.name}</td>
                      <td className="caption py-4 pe-6 whitespace-nowrap">
                        AED {Math.round(area.stats!.median_price_per_sqft!).toLocaleString("en-AE")}
                      </td>
                      <td
                        className={cn(
                          "caption py-4 pe-6",
                          area.id === bestYield?.id && "text-accent",
                        )}
                      >
                        {area.stats?.gross_yield_pct
                          ? `${area.stats.gross_yield_pct.toFixed(1)}%`
                          : "-"}
                      </td>
                      <td className="caption py-4 pe-6">
                        {area.stats?.yoy_price_change_pct !== null &&
                        area.stats?.yoy_price_change_pct !== undefined
                          ? `${area.stats.yoy_price_change_pct >= 0 ? "+" : ""}${area.stats.yoy_price_change_pct.toFixed(1)}%`
                          : "-"}
                      </td>
                      <td className="caption py-4 pe-6">{area.stats?.transaction_count ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FreshnessStamp attribution={attribution} className="mt-6" />
          </>
        )
      }
      assumptions={
        <Assumptions>
          <p className="caption max-w-measure">
            Yields here are gross. Service charges differ enough between buildings that two
            properties in the same community can have materially different net returns, which is why
            the community is where you start, not where you finish.
          </p>
        </Assumptions>
      }
    />
  );
}
