import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { FreshnessStamp } from "./freshness-stamp";
import { attributionFor } from "@/data/market";
import type { AreaWithStats } from "@/data/market-types";
import { Photo } from "@/components/site/photo";
import type { PhotoSlug } from "@/lib/photos";
import { Container, Eyebrow } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";

/**
 * The Investment Snapshot.
 *
 * Three quiet questions, and a real answer computed from recorded Dubai Land
 * Department transactions rather than from a lookup table of marketing copy.
 * It is the site's signature interactive and it earns that by being honest:
 * the reader gives a budget, what they want from the money and when, and the
 * card names the community the evidence points at, says why in one sentence,
 * and cites where the number came from.
 *
 * Three deliberate decisions.
 *
 * It asks for nothing. No email, no phone, no "unlock your result". The
 * qualification answers are captured only if the reader then chooses to take
 * it further, at which point they arrive at the enquiry with intent and budget
 * already known, which is worth more than an address harvested from someone
 * who wanted a number.
 *
 * It cannot flatter. The ranking is the recorded figures, so a low budget with
 * a growth objective returns the community that actually fits, and if the
 * evidence for it is thin the card says so instead of inventing confidence.
 *
 * It runs entirely on data already in the page. No request, no spinner, no
 * empty state: the areas come from the same loader the rest of the homepage
 * uses.
 */

type Objective = "yield" | "growth" | "live";
type Horizon = "soon" | "medium" | "long";

const BUDGETS = [
  { id: "under-1_5m", label: "Under AED 1.5M", ceiling: 1_500_000 },
  { id: "1_5m-4m", label: "AED 1.5M to 4M", ceiling: 4_000_000 },
  { id: "4m-10m", label: "AED 4M to 10M", ceiling: 10_000_000 },
  { id: "over-10m", label: "Above AED 10M", ceiling: Number.POSITIVE_INFINITY },
] as const;

const OBJECTIVES: ReadonlyArray<{ id: Objective; label: string; question: string }> = [
  { id: "yield", label: "Rental income", question: "the rent it earns" },
  { id: "growth", label: "Capital growth", question: "what it is worth later" },
  { id: "live", label: "Somewhere to live", question: "how it is to live in" },
];

const HORIZONS: ReadonlyArray<{ id: Horizon; label: string }> = [
  { id: "soon", label: "This year" },
  { id: "medium", label: "One to three years" },
  { id: "long", label: "Longer, or unsure" },
];

type BudgetId = (typeof BUDGETS)[number]["id"];

/** Below this many recorded sales we decline to rank rather than guess. */
const THIN_EVIDENCE = 30;

export function InvestmentSnapshot({ areas }: { areas: readonly AreaWithStats[] }) {
  const [budget, setBudget] = useState<BudgetId>("1_5m-4m");
  const [objective, setObjective] = useState<Objective>("yield");
  const [horizon, setHorizon] = useState<Horizon>("medium");
  const [answered, setAnswered] = useState(false);

  const ranked = useMemo(() => {
    const ceiling = BUDGETS.find((b) => b.id === budget)?.ceiling ?? Number.POSITIVE_INFINITY;

    const eligible = areas.filter(
      (area) =>
        area.stats &&
        area.stats.transaction_count >= THIN_EVIDENCE &&
        area.stats.median_price !== null &&
        area.stats.median_price <= ceiling,
    );

    /* One measure per objective, and each one is a column that exists in the
     * stats table. Nothing here is a weighting invented to make the answer
     * look considered. */
    const score = (area: AreaWithStats) => {
      const s = area.stats!;
      if (objective === "yield") return s.gross_yield_pct ?? -1;
      if (objective === "growth") return s.yoy_price_change_pct ?? -1;
      /* "Somewhere to live" is not a number, so it is not pretended to be one:
       * it ranks by the size of the typical home, which is the closest thing
       * the record holds to how a family experiences a community. */
      return s.median_price !== null && s.median_price_per_sqft
        ? s.median_price / s.median_price_per_sqft
        : -1;
    };

    /*
     * Horizon is the tiebreaker, and it is a real one. A reader buying this
     * year has to be able to sell, so recorded volume decides between two
     * communities the primary measure ranks level; a long horizon does not
     * care and leaves the order alone.
     */
    return [...eligible].sort((a, b) => {
      const primary = score(b) - score(a);
      if (horizon !== "soon" || Math.abs(primary) > 0.25) return primary;
      return (b.stats!.transaction_count ?? 0) - (a.stats!.transaction_count ?? 0);
    });
  }, [areas, budget, objective, horizon]);

  const top = ranked[0];
  const stats = top?.stats ?? null;
  const attribution = attributionFor(stats?.provenance ?? null, stats?.last_updated ?? null);

  /* One event when the reader actually engages, not on render, and not once
   * per keystroke of a control they are still making up their mind about. */
  function note(next: Partial<{ budget: BudgetId; objective: Objective; horizon: Horizon }>) {
    if (!answered) {
      setAnswered(true);
      track("start_form", { contentName: "investment-snapshot" });
    }
    if (next.budget) setBudget(next.budget);
    if (next.objective) setObjective(next.objective);
    if (next.horizon) setHorizon(next.horizon);
  }

  const objectiveCopy = OBJECTIVES.find((o) => o.id === objective)!;

  return (
    <section className="bg-paper-cool py-section">
      <Container>
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-12">
          {/* The questions. Left column, quiet, no form furniture: these are
              choices, not fields, and nothing is submitted. */}
          <div className="lg:col-span-5">
            <Eyebrow>Investment snapshot</Eyebrow>
            <h2 className="display-2 mt-5 text-balance">
              Three answers, and we will show you where the record points.
            </h2>
            <p className="body-text mt-5 max-w-md text-muted-foreground">
              Computed from registered Dubai Land Department transactions. It asks for nothing and
              it will not flatter your budget.
            </p>

            <fieldset className="mt-10">
              <legend className="eyebrow">What are you working with?</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {BUDGETS.map((option) => (
                  <SnapshotChoice
                    key={option.id}
                    selected={budget === option.id}
                    onSelect={() => note({ budget: option.id })}
                  >
                    {option.label}
                  </SnapshotChoice>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className="eyebrow">What matters most?</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {OBJECTIVES.map((option) => (
                  <SnapshotChoice
                    key={option.id}
                    selected={objective === option.id}
                    onSelect={() => note({ objective: option.id })}
                  >
                    {option.label}
                  </SnapshotChoice>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className="eyebrow">And when?</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {HORIZONS.map((option) => (
                  <SnapshotChoice
                    key={option.id}
                    selected={horizon === option.id}
                    onSelect={() => note({ horizon: option.id })}
                  >
                    {option.label}
                  </SnapshotChoice>
                ))}
              </div>
            </fieldset>
          </div>

          {/* The answer. A card with a photograph of the place in it, because
              the name of a community means nothing to someone who has never
              been. */}
          <div className="lg:col-span-6 lg:col-start-7">
            {top && stats ? (
              <article data-surface="dark" className="relative overflow-hidden bg-ink">
                {/*
                  The photograph bands the top and the answer sits on solid ink
                  below it, rather than the type sitting over the image.
                  Measured, not preferred: the label colour on a dark surface
                  is #9fb2a8, which needs a ground at or below about 5%
                  luminance to clear AA, and the answer can select a bright
                  daylight photograph, where even an 88% veil leaves the ground
                  at 8%. A scrim heavy enough to pass would have hidden the
                  picture anyway. It also stops this card repeating the move
                  the hero already made.
                */}
                <div className="relative aspect-16/10 w-full">
                  <Photo
                    slug={photoForArea(top.slug)}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent"
                  />
                </div>

                <div className="relative p-8 lg:p-10">
                  <p className="eyebrow">On the record, that points to</p>
                  <p className="display-2 mt-3">{top.name}</p>

                  <p className="body-text mt-4 max-w-lg text-on-dark-muted">
                    {readingFor(objective, top, stats)}
                    {horizon === "soon" ? (
                      <>
                        {" "}
                        Buying this year, liquidity matters as much as the headline:{" "}
                        {stats.transaction_count.toLocaleString("en-AE")} recorded sales there in
                        twelve months is what tells you it can be sold again.
                      </>
                    ) : null}
                  </p>

                  <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-6">
                    <SnapshotFigure
                      label="Median"
                      value={`AED ${Math.round((stats.median_price ?? 0) / 1000).toLocaleString("en-AE")}k`}
                    />
                    <SnapshotFigure
                      label="Gross yield"
                      value={stats.gross_yield_pct ? `${stats.gross_yield_pct.toFixed(1)}%` : "-"}
                    />
                    <SnapshotFigure
                      label="Sales recorded"
                      value={stats.transaction_count.toLocaleString("en-AE")}
                    />
                  </dl>

                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link to="/areas/$slug" params={{ slug: top.slug }}>
                      <Button>See the full read</Button>
                    </Link>
                    <FreshnessStamp attribution={attribution} />
                  </div>
                </div>
              </article>
            ) : (
              /* The honest empty state. A budget with nothing under it gets
                 told so, not shown the cheapest thing we have. */
              <div className="flex min-h-[26rem] flex-col justify-end border border-border bg-paper p-8 lg:p-10">
                <p className="display-3">Nothing in the record fits that yet.</p>
                <p className="body-text mt-4 max-w-md text-muted-foreground">
                  We hold too few registered sales in that band to rank communities honestly. Tell a
                  consultant what you are looking for and they will answer from what they are seeing
                  on the ground, which is the right source for a question the data cannot settle.
                </p>
                <Link to="/contact" className="mt-8 inline-block">
                  <Button>Ask a consultant</Button>
                </Link>
              </div>
            )}

            <p className="caption mt-5">
              Ranked on {objectiveCopy.question}. A reading of recorded evidence, not personal
              advice.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SnapshotChoice({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "eyebrow border px-4 py-3 transition-colors duration-base ease-editorial",
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-foreground hover:border-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SnapshotFigure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="display-3 mt-1.5">{value}</dd>
    </div>
  );
}

/** One sentence, in plain language, saying what the ranking actually means. */
function readingFor(
  objective: Objective,
  area: AreaWithStats,
  stats: NonNullable<AreaWithStats["stats"]>,
): string {
  if (objective === "yield") {
    return stats.gross_yield_pct
      ? `Of the communities inside that budget, ${area.name} returns the most rent against price: ${stats.gross_yield_pct.toFixed(1)}% gross, before service charges, which are the thing that decides what actually reaches you.`
      : `${area.name} is the strongest fit inside that budget. We hold no registered tenancy contracts for it yet, so there is no yield here we would stand behind.`;
  }
  if (objective === "growth") {
    const change = stats.yoy_price_change_pct;
    if (change === null) {
      return `${area.name} is the strongest fit inside that budget, though we do not hold a full year of comparable records for it yet.`;
    }
    return change >= 0
      ? `Prices in ${area.name} are ${change.toFixed(1)}% above a year ago on recorded sales. Past movement is not a forecast, but it is the only part of this anyone can actually check.`
      : `${area.name} is ${Math.abs(change).toFixed(1)}% below a year ago on recorded sales. That is a negotiating position rather than a warning, and it is worth understanding why before you act on it.`;
  }
  const typicalSqft =
    stats.median_price && stats.median_price_per_sqft
      ? Math.round(stats.median_price / stats.median_price_per_sqft)
      : null;
  return typicalSqft
    ? `Inside that budget, ${area.name} buys the most room: a typical home there runs about ${typicalSqft.toLocaleString("en-AE")} square feet. Space is the part of living somewhere the record can measure; schools and the commute are a conversation.`
    : `${area.name} is the strongest fit inside that budget for somewhere to live in rather than let out.`;
}

/**
 * The photograph for a community.
 *
 * A small map in source rather than a database column, because which frame
 * sits in which composition is a design decision made photograph by
 * photograph, and an editor changing an area's hero image in the CMS should
 * not silently re-cut the homepage. Anything unmapped falls back to the city.
 */
const AREA_PHOTOS: Partial<Record<string, PhotoSlug>> = {
  "palm-jumeirah": "palm-jumeirah-dusk-aerial",
  "downtown-dubai": "downtown-interchange-day",
  "dubai-marina": "dubai-marina-from-water",
  "business-bay": "business-bay-dusk",
  "dubai-hills-estate": "harbour-golden-hour",
  "jumeirah-village-circle": "skyline-across-water-haze",
};

function photoForArea(slug: string): PhotoSlug {
  return AREA_PHOTOS[slug] ?? "downtown-skyline-night";
}
