import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatMetricValue, type MarketRow } from "@/data/market-public";
import {
  describeChange,
  directionOf,
  momentumFor,
  rentGapSeries,
  shareSeries,
} from "@/data/market-insights";
import { cn } from "@/lib/utils";

/**
 * The read, before the charts.
 *
 * A page of charts asks the reader to do the analysis. Most will not, and the
 * ones who would are the ones with the least patience for being handed raw
 * series. So the page opens with what the quarter actually says, in sentences,
 * with the figure that supports each one sitting next to it.
 *
 * Every sentence here is assembled from published rows by `market-insights`.
 * Nothing is written in advance and nothing is estimated: where a comparison
 * cannot be made from the data, the line is not rendered. That is why this
 * component returns a variable number of statements rather than a fixed four.
 *
 * The plain-language line under each figure is the rule from CLAUDE.md: a
 * number is always paired with what it means for the person reading it.
 */
export function MarketBrief({
  rows,
  periodLabel,
}: {
  rows: readonly MarketRow[];
  periodLabel: string | null;
}) {
  const sales = momentumFor(rows, "registered_sale_count");
  const rentals = momentumFor(rows, "registered_rental_contract_count");
  const rent = momentumFor(rows, "median_registered_annual_rent_aed");

  const offPlan = shareSeries(rows, "registered_sale_count", "off_plan", "existing");
  const latestOffPlan = offPlan.at(-1) ?? null;
  const priorOffPlan = offPlan.length > 4 ? offPlan.at(-5) : null;

  const gap = rentGapSeries(rows);
  const latestGap = gap.at(-1) ?? null;

  const statements: { figure: string; label: string; meaning: string; change: number | null }[] =
    [];

  if (sales) {
    const yoy = describeChange(sales.yearOnYear);
    statements.push({
      figure: formatMetricValue("registered_sale_count", sales.latest.metric_value),
      label: "Registered sale transactions",
      change: sales.yearOnYear,
      meaning: yoy
        ? `Sales registered with the Land Department were ${yoy} against the same quarter a year earlier. This counts how busy the market was, not what anything cost.`
        : "Sales registered with the Land Department this quarter. This counts how busy the market was, not what anything cost.",
    });
  }

  if (latestOffPlan) {
    const now = latestOffPlan.aShare;
    const then = priorOffPlan?.aShare ?? null;
    const move =
      then === null
        ? null
        : Math.abs(now - then) < 1
          ? "about where it was a year ago"
          : `${now > then ? "up" : "down"} from ${then.toFixed(0)}% a year ago`;
    statements.push({
      figure: `${now.toFixed(0)}%`,
      label: "Of registered sales were off-plan",
      change: then === null ? null : now - then,
      meaning: `${
        now >= 50
          ? "More than half of what changes hands is bought from a developer rather than from an owner"
          : "Most of what changes hands is bought from an owner rather than from a developer"
      }${move ? `, ${move}` : ""}. It tells you which market you are competing in before you start looking.`,
    });
  }

  if (latestGap) {
    statements.push({
      figure: `${latestGap.gapPct >= 0 ? "+" : ""}${latestGap.gapPct.toFixed(0)}%`,
      label: "New tenants pay over renewing ones",
      change: latestGap.gapPct,
      meaning:
        latestGap.gapPct > 3
          ? "A new tenancy is registering above a renewal, so sitting tenants are below the market and an owner's income changes at the next re-let, not at renewal."
          : "New tenancies and renewals are registering close together, which is what a rental market looks like when the pressure has come out of it.",
    });
  }

  if (rent) {
    const yoy = describeChange(rent.yearOnYear);
    statements.push({
      figure: formatMetricValue("median_registered_annual_rent_aed", rent.latest.metric_value),
      label: "Median registered annual rent",
      change: rent.yearOnYear,
      meaning: yoy
        ? `The middle registered rent across Dubai was ${yoy} year on year. Half of contracts were agreed below this and half above, so your building may sit either side of it.`
        : "The middle registered rent across Dubai. Half of contracts were agreed below this and half above.",
    });
  }

  if (rentals && statements.length < 4) {
    const yoy = describeChange(rentals.yearOnYear);
    statements.push({
      figure: formatMetricValue("registered_rental_contract_count", rentals.latest.metric_value),
      label: "Registered rental contracts",
      change: rentals.yearOnYear,
      meaning: yoy
        ? `Tenancy contracts registered in the quarter, ${yoy} year on year, new and renewed together.`
        : "Tenancy contracts registered in the quarter, new and renewed together.",
    });
  }

  if (statements.length === 0) return null;

  return (
    <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
      {statements.map((statement) => (
        <div key={statement.label} className="bg-background p-7 lg:p-9">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-4xl leading-none tabular-nums lg:text-5xl">
              {statement.figure}
            </p>
            <ChangeChip change={statement.change} />
          </div>
          <p className="eyebrow mt-4 text-gold-ink">{statement.label}</p>
          <p className="body-text mt-3 text-muted-foreground">{statement.meaning}</p>
        </div>
      ))}
      {periodLabel ? (
        <p className="caption bg-background p-7 text-muted-foreground sm:col-span-2 lg:px-9">
          Every figure above covers {periodLabel}, the latest quarter the registry has finished, and
          is compared with the same quarter a year earlier rather than with the quarter before it,
          so a seasonal dip is not reported as a market turning.
        </p>
      ) : null}
    </div>
  );
}

/** A change, as a small signed chip. Neutral colour: up is not "good". */
function ChangeChip({ change }: { change: number | null }) {
  const direction = directionOf(change);
  if (change === null || direction === "flat") return null;
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-semibold tabular-nums",
        direction === "up"
          ? "border-green-mid/30 text-green-mid"
          : "border-gold-ink/30 text-gold-ink",
      )}
    >
      <Icon aria-hidden className="size-3" />
      {Math.abs(change).toFixed(1)}%
      <span className="sr-only">
        {direction === "up" ? "higher" : "lower"} than the same quarter a year earlier
      </span>
    </span>
  );
}

