import { useState } from "react";

import { Assumptions, CalculatorLayout, Headline, OptionField } from "../calculator-shell";
import { FreshnessStamp } from "@/components/market/freshness-stamp";
import { attributionFor } from "@/data/market";
import type { AreaWithStats } from "@/data/market-types";
import { Eyebrow } from "@/components/ui/section";

/**
 * "Best areas for…"
 *
 * Ranks communities against one of four goals. Nobody pays to appear, the
 * ordering is computed from recorded transactions, and, the part that keeps it
 * honest, a community we hold too little data on is left out rather than
 * ranked on a thin median.
 *
 * The family and short-let goals are inferred from transaction evidence rather
 * than from opinion: a community that transacts in larger, lower-density units
 * behaves like a family one, and a liquid, higher-yield, smaller-unit community
 * behaves like a short-let one. The page says as much, because a proxy
 * presented as a fact is the kind of thing that gets repeated.
 */

type Goal = "yield" | "growth" | "family" | "short_let";

const GOALS: ReadonlyArray<{ value: Goal; label: string }> = [
  { value: "yield", label: "Rental income" },
  { value: "growth", label: "Capital growth" },
  { value: "family", label: "Family living" },
  { value: "short_let", label: "Short-term letting" },
];

const EXPLANATIONS: Record<Goal, string> = {
  yield: "Ranked by gross rental yield, a year's registered rent against the typical sale price.",
  growth: "Ranked by how far the median price per square foot has moved in the last year.",
  family:
    "A proxy, not a lifestyle verdict: ranked by typical unit size, since communities transacting in larger homes are the ones families buy in. It says nothing about schools or parks, ask us about those.",
  short_let:
    "A proxy: ranked on yield and liquidity together, since short-let returns depend on both a strong rental base and enough turnover to exit. Licensing and building rules decide whether you can actually do it.",
};

/** Too few recorded sales to rank a community honestly. */
const MIN_TRANSACTIONS = 30;

export function BestAreas({ areas }: { areas: readonly AreaWithStats[] }) {
  const [goal, setGoal] = useState<Goal>("yield");

  const eligible = areas.filter(
    (area) => area.stats && area.stats.transaction_count >= MIN_TRANSACTIONS,
  );

  const scored = eligible
    .map((area) => {
      const stats = area.stats!;
      let score: number | null = null;

      switch (goal) {
        case "yield":
          score = stats.gross_yield_pct;
          break;
        case "growth":
          score = stats.yoy_price_change_pct;
          break;
        case "family":
          /* Typical unit size, derived from median price over median price per
           * square foot, larger homes, family communities. */
          score =
            stats.median_price && stats.median_price_per_sqft
              ? stats.median_price / stats.median_price_per_sqft
              : null;
          break;
        case "short_let":
          score =
            stats.gross_yield_pct !== null
              ? stats.gross_yield_pct * Math.log10(Math.max(10, stats.transaction_count))
              : null;
          break;
      }

      return { area, score };
    })
    .filter((entry): entry is { area: AreaWithStats; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score);

  const attribution = attributionFor(
    eligible[0]?.stats?.provenance ?? null,
    eligible[0]?.stats?.last_updated ?? null,
  );

  const leader = scored[0];

  const describe = (entry: { area: AreaWithStats; score: number }) => {
    const stats = entry.area.stats!;
    switch (goal) {
      case "yield":
        return `${entry.score.toFixed(1)}% gross`;
      case "growth":
        return `${entry.score >= 0 ? "+" : ""}${entry.score.toFixed(1)}% year on year`;
      case "family":
        return `Typical home ${Math.round(entry.score).toLocaleString("en-AE")} sq ft`;
      case "short_let":
        return `${stats.gross_yield_pct?.toFixed(1)}% yield · ${stats.transaction_count} sales`;
    }
  };

  return (
    <CalculatorLayout
      inputs={
        <>
          <OptionField
            label="What matters most to you?"
            value={goal}
            options={GOALS}
            onChange={setGoal}
          />
          <p className="caption">{EXPLANATIONS[goal]}</p>
        </>
      }
      result={
        scored.length === 0 ? (
          <div className="border border-border p-10">
            <Eyebrow>Not enough evidence</Eyebrow>
            <p className="body-text mt-5 text-muted-foreground">
              We do not yet hold enough recorded sales to rank communities on this honestly. Ask us
              directly and we will tell you what we are seeing on the ground.
            </p>
          </div>
        ) : (
          <>
            <Headline
              label={`Best for ${GOALS.find((entry) => entry.value === goal)?.label.toLowerCase()}`}
              value={<span className="display-2">{leader!.area.name}</span>}
              meaning={`${describe(leader!)}. ${EXPLANATIONS[goal]}`}
              tone="positive"
            />

            <ol className="mt-10">
              {scored.map((entry, index) => (
                <li
                  key={entry.area.id}
                  className="grid items-baseline gap-3 border-t border-border/60 py-4 md:grid-cols-12"
                >
                  <span className="eyebrow md:col-span-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="body-text md:col-span-5">{entry.area.name}</span>
                  <span className="caption md:col-span-6 md:text-end">{describe(entry)}</span>
                </li>
              ))}
            </ol>

            <FreshnessStamp attribution={attribution} className="mt-6" />
          </>
        )
      }
      assumptions={
        <Assumptions
          entries={[
            {
              label: "Minimum evidence",
              value: `${MIN_TRANSACTIONS} recorded sales in the last year`,
            },
            {
              label: "Ranking",
              value: "Computed from recorded transactions. Nobody pays to appear",
            },
          ]}
        >
          <p className="caption max-w-measure">
            Communities we hold too little data on are left out rather than ranked on a thin median.
            A short list is more useful than a long one padded with guesses.
          </p>
        </Assumptions>
      }
    />
  );
}
