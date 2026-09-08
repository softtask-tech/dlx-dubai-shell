import { useMemo, useState } from "react";

import type { OffPlanSplitRow } from "@/data/market-public";
import { cn } from "@/lib/utils";

/**
 * What off-plan costs against what ready property costs, in the same community.
 *
 * This is the single most expensive question a Dubai buyer gets wrong, and
 * until now nothing on this site could answer it. Every price the market pages
 * published was the blended one — off-plan and resale together — which is the
 * figure least useful to somebody deciding between the two.
 *
 * SAY WHAT THIS IS NOT. It is not a measure of whether off-plan is overpriced,
 * and the component says so on the page rather than only here. Off-plan is new
 * construction; ready stock in the same community can be fifteen years old, on
 * a lower specification, in a building with a worse lift. Some of every gap
 * below is what "new" costs anywhere, and none of it is separable from the
 * published figures. What the gap does say, exactly, is what buyers paid: in
 * this community, this quarter, a square foot of off-plan registered at this
 * price and a square foot of ready property registered at that one.
 *
 * A dumbbell rather than a bar chart, because the reading is a distance. Two
 * marks joined by a rule, ready on one end and off-plan on the other, and the
 * length of the rule is the answer. A bar would have made the reader compare
 * two heights in different rows and do the subtraction themselves.
 *
 * SORTED, NOT FILTERED. Every community where both sides clear the observation
 * floor is here, widest gap first, including the ones where the gap is small
 * and the one where it runs the other way.
 */
const aed = (value: number) => `AED ${Math.round(value).toLocaleString("en-AE")}`;
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(0)}%`;

export function OffPlanGap({
  rows,
  periodLabel,
}: {
  rows: readonly OffPlanSplitRow[];
  periodLabel: string;
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      rows
        .map((row) => ({
          ...row,
          gap: (row.offPlanValue / row.existingValue - 1) * 100,
        }))
        .sort((a, b) => b.gap - a.gap),
    [rows],
  );

  if (items.length < 5) return null;

  const max = Math.max(...items.flatMap((item) => [item.offPlanValue, item.existingValue]));
  /* One shared scale across every row. Per-row scaling would make a AED 500
   * gap in a cheap community draw the same width as a AED 3,000 gap in an
   * expensive one, which is the one thing this chart must not do. */
  const at = (value: number) => `${(value / max) * 100}%`;

  const gaps = items.map((item) => item.gap);
  const mid = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
  const cheaper = items.filter((item) => item.gap < 0);

  /* Long lists get a lid on them. The principle is that nothing is filtered
   * out, not that a reader must scroll past thirty rows to reach the next
   * section, so the rest are one button away rather than gone. */
  const LID = 12;
  const shown = open ? items : items.slice(0, LID);

  return (
    <figure className="m-0">
      <div dir="ltr" className="border-t border-border">
        {/* The two ends, named once, so no row needs its own key. */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 py-5">
          <span className="caption inline-flex items-center gap-2.5 text-muted-foreground">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-[var(--gold-ink)]" />
            Ready property
          </span>
          <span className="caption inline-flex items-center gap-2.5 text-muted-foreground">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-[var(--green-mid)]" />
            Off-plan
          </span>
          <span className="caption ms-auto text-muted-foreground tabular-nums">
            {items.length} communities · median gap {signed(mid)}
          </span>
        </div>

        <ul className="list-none p-0">
          {shown.map((item) => {
            const low = Math.min(item.existingValue, item.offPlanValue);
            const high = Math.max(item.existingValue, item.offPlanValue);
            return (
              <li
                key={item.entityId}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-border/60 py-4 sm:grid-cols-[13rem_minmax(0,1fr)_4.5rem]"
              >
                <p className="caption truncate text-foreground sm:order-1">{item.nameEn}</p>

                {/* The rule and its two ends. */}
                <div className="order-3 col-span-2 sm:order-2 sm:col-span-1">
                  <div className="relative h-6">
                    <span
                      aria-hidden
                      className="absolute top-1/2 h-px -translate-y-1/2 bg-[var(--border-strong)]"
                      style={{ left: at(low), right: `calc(100% - ${at(high)})` }}
                    />
                    <span
                      aria-hidden
                      className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold-ink)]"
                      style={{ left: at(item.existingValue) }}
                    />
                    <span
                      aria-hidden
                      className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--green-mid)]"
                      style={{ left: at(item.offPlanValue) }}
                    />
                  </div>
                  <p className="caption mt-1 text-muted-foreground tabular-nums">
                    {aed(item.existingValue)} ready · {aed(item.offPlanValue)} off-plan ·{" "}
                    {item.existingCount.toLocaleString("en-AE")} and{" "}
                    {item.offPlanCount.toLocaleString("en-AE")} registered sales
                  </p>
                </div>

                <p
                  className={cn(
                    "font-display order-2 text-end text-xl tabular-nums sm:order-3 sm:text-2xl",
                    item.gap < 0 ? "text-[var(--green-mid)]" : "text-foreground",
                  )}
                >
                  {signed(item.gap)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {items.length > LID ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="focus-ring eyebrow mt-6 inline-flex min-h-11 items-center border-b border-gold pb-1 text-gold-ink transition-colors hover:text-foreground"
        >
          {open ? "Show the widest twelve" : `Show all ${items.length} communities`}
        </button>
      ) : null}

      <figcaption className="body-text mt-8 max-w-measure text-muted-foreground">
        <strong className="font-normal text-foreground">
          This is what buyers paid, not a verdict on whether they overpaid.
        </strong>{" "}
        Off-plan is new construction and the ready property beside it can be fifteen years old, so
        part of every gap here is simply what new costs anywhere, and the published figures cannot
        separate the two. Read it as the question to take into the room: in {periodLabel}, a square
        foot of off-plan in these communities registered a median {signed(mid)} against a square
        foot of something you could walk through.{" "}
        {cheaper.length === 1 ? (
          <>
            In {cheaper[0]!.nameEn} it registered below the ready-property price, which is worth
            asking about.
          </>
        ) : cheaper.length > 1 ? (
          <>
            In {cheaper.length} of them it registered below the ready-property price, which is worth
            asking about.
          </>
        ) : (
          <>Not one of them registered off-plan below the ready-property price.</>
        )}{" "}
        Both sides of every row cleared thirty registered sales on their own; communities where only
        one side did are not shown, because a ratio against three transactions is not a figure.
      </figcaption>
    </figure>
  );
}
