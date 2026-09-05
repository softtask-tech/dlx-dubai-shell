import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import {
  CONFIDENCE_LABELS,
  MARKET_METRICS,
  MAX_COMPARE_COMMUNITIES,
  METRIC_LABELS,
  METRIC_MEANINGS,
  TOO_FEW_RECORDS,
  formatMetricValue,
  formatPeriod,
  sourceLine,
  type MarketMetric,
  type MarketRow,
} from "@/data/market-public";
import {
  compareMarketCommunitiesFn,
  getMarketMetadataFn,
  searchMarketEntitiesFn,
} from "@/data/market-public.functions";
import { pageHead } from "@/lib/seo";
import { QualifiedForm } from "@/components/forms/qualified-form";
import { Reveal } from "@/components/site/reveal";
import { Section, Container, Eyebrow } from "@/components/ui/section";

/** Only these three make sense side by side; the change metrics need a baseline explanation. */
const COMPARABLE_METRICS = [
  "registered_sale_count",
  "registered_rental_contract_count",
  "median_registered_annual_rent_aed",
] as const satisfies readonly MarketMetric[];

const searchSchema = z.object({
  ids: z.string().max(120).optional(),
  metric: z.enum(MARKET_METRICS).catch("registered_sale_count").optional(),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  q: z.string().max(60).optional(),
});

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(new Set(raw.split(",").filter((id) => /^[0-9]{1,12}$/.test(id)))).slice(
    0,
    MAX_COMPARE_COMMUNITIES,
  );
}

export const Route = createFileRoute("/market-intelligence/compare")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    ids: search.ids,
    metric: search.metric,
    period: search.period,
    q: search.q,
  }),
  loader: async ({ deps }) => {
    const ids = parseIds(deps.ids);
    const metric = (deps.metric ?? "registered_sale_count") as MarketMetric;
    const metadata = await getMarketMetadataFn();

    const [matches, rows] = await Promise.all([
      deps.q && deps.q.trim().length > 1
        ? searchMarketEntitiesFn({ data: { query: deps.q.trim(), types: ["community"], limit: 20 } })
        : Promise.resolve([]),
      ids.length > 0 && deps.period
        ? compareMarketCommunitiesFn({
            data: { communityIds: ids, metric, grain: "quarter", period: deps.period },
          })
        : Promise.resolve([]),
    ]);

    /* Without an explicit period, fall back to the latest one each community has. */
    let resolved = rows;
    let period = deps.period ?? null;
    if (ids.length > 0 && !deps.period) {
      const { getMarketEntitySeriesFn } = await import("@/data/market-public.functions");
      const first = ids[0];
      if (first) {
        const series = await getMarketEntitySeriesFn({
          data: {
            entityType: "community",
            entityId: first,
            metric,
            grain: "quarter",
            from: "2015-01-01",
            to: "2026-12-31",
            limit: 60,
          },
        });
        const last = series.at(-1);
        if (last) {
          period = last.period_start;
          resolved = await compareMarketCommunitiesFn({
            data: { communityIds: ids, metric, grain: "quarter", period: last.period_start },
          });
        }
      }
    }

    return { metadata, ids, metric, period, matches, rows: resolved };
  },
  head: () =>
    pageHead({
      path: "/market-intelligence/compare",
      title: "Compare Dubai communities",
      description:
        "Put up to six Dubai communities side by side on registered sale transactions, registered rental contracts or the median registered annual rent, from Dubai Land Department open data.",
      tagline: "Six communities, one honest measure.",
      noIndex: true,
      breadcrumbs: [
        { name: "Market Intelligence", path: "/market-intelligence" },
        { name: "Compare communities", path: "/market-intelligence/compare" },
      ],
    }),
  component: ComparePage,
});

function ComparePage() {
  const { metadata, ids, metric, period, matches, rows } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState(search.q ?? "");

  const chosen = rows
    .filter((row) => row.segment_code === "all")
    .sort((a, b) => b.metric_value - a.metric_value);
  const peak = chosen.reduce((max, row) => Math.max(max, row.metric_value), 0);

  function setIds(next: readonly string[]) {
    void navigate({
      search: (prev) => ({
        ...prev,
        ids: next.length ? next.join(",") : undefined,
        period: undefined,
      }),
    });
  }

  return (
    <>
      <Section className="pt-40">
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-10">
            <Link to="/market-intelligence" className="eyebrow link-underline">
              Market Intelligence
            </Link>
          </nav>
          <Eyebrow>Compare</Eyebrow>
          <h1 className="display-1 mt-5 max-w-4xl text-balance">
            Up to six communities, on one measure.
          </h1>
          <p className="lead mt-8 max-w-2xl text-muted-foreground">
            One measure at a time, one completed quarter at a time, so the comparison is like for
            like. {METRIC_MEANINGS[metric]}
          </p>
        </Reveal>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-3">Choose communities</h2>
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  void navigate({
                    search: (prev) => ({ ...prev, q: query.trim() || undefined }),
                  });
                }}
              >
                <label htmlFor="community-search" className="eyebrow block">
                  Search by community name
                </label>
                <div className="mt-3 flex gap-3">
                  <input
                    id="community-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Marina, Downtown, Jumeirah"
                    className="w-full border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:border-accent"
                  />
                  <button type="submit" className="eyebrow border border-ink px-5 py-3">
                    Search
                  </button>
                </div>
              </form>

              {matches.length > 0 ? (
                <ul className="mt-8 divide-y divide-border border-y border-border">
                  {matches.map((match) => {
                    const selected = ids.includes(match.entity_id);
                    const full = ids.length >= MAX_COMPARE_COMMUNITIES && !selected;
                    return (
                      <li key={match.entity_id} className="flex items-center justify-between gap-4 py-4">
                        <span className="body-text">{match.name_en}</span>
                        <button
                          type="button"
                          disabled={full}
                          onClick={() =>
                            setIds(
                              selected
                                ? ids.filter((id) => id !== match.entity_id)
                                : [...ids, match.entity_id],
                            )
                          }
                          className="eyebrow shrink-0 text-accent disabled:text-muted-foreground"
                        >
                          {selected ? "Remove" : full ? "Six is the limit" : "Add"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : search.q ? (
                <p className="body-text mt-8 text-muted-foreground">
                  No published community matches that name.
                </p>
              ) : null}

              <fieldset className="mt-12 border-0 p-0">
                <legend className="eyebrow">Measure</legend>
                <div className="mt-4 flex flex-col gap-3">
                  {COMPARABLE_METRICS.map((option) => (
                    <label key={option} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="metric"
                        value={option}
                        checked={metric === option}
                        onChange={() =>
                          void navigate({
                            search: (prev) => ({ ...prev, metric: option, period: undefined }),
                          })
                        }
                        className="accent-accent"
                      />
                      <span className="body-text">{METRIC_LABELS[option]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              {ids.length === 0 ? (
                <div className="border border-border p-12">
                  <h2 className="display-3">Nothing selected yet.</h2>
                  <p className="body-text mt-6 max-w-measure text-muted-foreground">
                    Search for a community and add it. Add a second to see them against each other,
                    up to six.
                  </p>
                </div>
              ) : chosen.length === 0 ? (
                <div className="border border-border p-12">
                  <h2 className="display-3">Not published for this quarter.</h2>
                  <p className="body-text mt-6 max-w-measure text-muted-foreground">
                    {TOO_FEW_RECORDS}
                  </p>
                </div>
              ) : (
                <figure className="m-0">
                  <figcaption>
                    <h2 className="display-3">{METRIC_LABELS[metric]}</h2>
                    <p className="caption mt-3">
                      {period ? formatPeriod("quarter", period) : "Latest complete quarter"} ·{" "}
                      {chosen.length} of {ids.length} selected{" "}
                      {ids.length === 1 ? "community" : "communities"} published for this quarter
                    </p>
                  </figcaption>

                  <ul className="mt-10 space-y-6">
                    {chosen.map((row) => (
                      <li key={row.entity_id}>
                        <div className="flex items-baseline justify-between gap-6">
                          <span className="body-text">{row.name_en}</span>
                          <span className="lead">{formatMetricValue(metric, row.metric_value)}</span>
                        </div>
                        <span
                          aria-hidden="true"
                          className="mt-3 block h-[6px] bg-accent"
                          style={{ width: `${peak ? (row.metric_value / peak) * 100 : 0}%` }}
                        />
                        <span className="caption mt-2 block">
                          {row.observation_count.toLocaleString("en-AE")} registered records ·{" "}
                          {CONFIDENCE_LABELS[row.confidence]}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <ComparisonTable rows={chosen} metric={metric} />
                  <p className="caption mt-10 max-w-measure">
                    {sourceLine(metadata.sourceExportDate)}
                  </p>
                </figure>
              )}
            </Reveal>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="display-2">Want this read for you?</h2>
              <p className="body-text mt-8 max-w-measure text-muted-foreground">
                Send us the communities you are weighing up and what you are trying to achieve. A
                consultant will go through the registered record with you. Information, not
                personalised advice, until we have spoken.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <QualifiedForm
                sourceType="market_report"
                sourceDetail="market-compare-communities"
                defaultIntent="invest"
                title="Discuss this comparison"
                description="Tell us your objective and we will answer with the registered record behind it."
                submitLabel="Send my question"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section flush className="border-t border-border py-10">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <p className="caption">Keep reading</p>
          <nav className="flex flex-wrap gap-8" aria-label="Related pages">
            <Link to="/market-intelligence" className="eyebrow link-underline">
              Dubai overview
            </Link>
            <Link to="/areas" className="eyebrow link-underline">
              Community guides
            </Link>
            <Link to="/directory" className="eyebrow link-underline">
              Official DLD directory
            </Link>
          </nav>
        </Container>
      </Section>
    </>
  );
}

function ComparisonTable({
  rows,
  metric,
}: {
  rows: readonly MarketRow[];
  metric: MarketMetric;
}) {
  return (
    <details className="mt-10 border-t border-border">
      <summary className="eyebrow cursor-pointer list-none py-4 [&::-webkit-details-marker]:hidden">
        Show this comparison as a table
      </summary>
      <div className="overflow-x-auto pb-6">
        <table className="w-full min-w-[32rem] border-collapse">
          <caption className="caption pb-4 text-left">
            {METRIC_LABELS[metric]} by community, with the number of registered records behind each
            figure.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                Community
              </th>
              <th scope="col" className="eyebrow py-3 pr-6 text-left font-normal">
                {METRIC_LABELS[metric]}
              </th>
              <th scope="col" className="eyebrow py-3 text-left font-normal">
                Records
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.entity_id} className="border-b border-border/60">
                <th scope="row" className="caption py-3 pr-6 text-left font-normal">
                  {row.name_en}
                </th>
                <td className="caption py-3 pr-6">
                  {formatMetricValue(metric, row.metric_value)}
                </td>
                <td className="caption py-3">{row.observation_count.toLocaleString("en-AE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
