import { cn } from "@/lib/utils";

/**
 * One figure, and where it sits among every community in Dubai.
 *
 * The community pages had counts and no context. "159 registered sales" and
 * "AED 1,379 per square foot" are both unreadable on their own — a reader has
 * no idea whether either is a lot, and the page offered nothing to measure
 * them against. Every figure on this site had the same problem: precise,
 * sourced, and impossible to interpret.
 *
 * So a figure arrives with the field it belongs to. Every community that
 * publishes the metric is a tick on the strip, this one is the mark, and the
 * Dubai figure is the line. Three readings come out of it without a sentence:
 * how this community compares to Dubai, how far it sits from the rest, and
 * whether the field is tightly bunched or spread right out — which is itself
 * worth knowing, because a community 10% above a tight median is unusual and
 * one 10% above a scattered median is ordinary.
 *
 * The rank is stated too, because a position on a strip is a feel and a rank
 * is a fact, and different readers want different ones.
 */
export type ContextFigure = {
  label: string;
  /** This community's value. Null renders the "not published" state. */
  value: number | null;
  /** The Dubai-wide figure for the same metric and period, where published. */
  dubai: number | null;
  /** Every community's value for this metric, this period. */
  field: readonly number[];
  format: (value: number) => string;
  /**
   * Which direction is good for a buyer. Drives only the plain-English line,
   * never the colour of the mark: a high price is bad for a buyer and good for
   * an owner, and the strip should not take a side.
   */
  higherIs: "better" | "worse" | "neither";
  /** One line: what this figure is. Not how it was computed. */
  meaning: string;
};

/** Reads the comparison out loud, the way a person would say it. */
function compare(value: number, dubai: number, higherIs: ContextFigure["higherIs"]) {
  const delta = ((value - dubai) / dubai) * 100;
  const size = Math.abs(delta);
  /* Inside 2% the two figures are the same figure, and saying "1% above the
   * Dubai median" invites a reader to act on noise. */
  if (size < 2) return "Level with the Dubai median.";
  const direction = delta > 0 ? "above" : "below";
  const rounded = size < 10 ? size.toFixed(1) : Math.round(size).toString();
  const gloss =
    higherIs === "neither"
      ? ""
      : (delta > 0) === (higherIs === "better")
        ? " In this community's favour."
        : " Against it.";
  return `${rounded}% ${direction} the Dubai median.${gloss}`;
}

export function FigureInContext({ figure }: { figure: ContextFigure }) {
  const { label, value, dubai, field, format, meaning } = figure;

  if (value == null) {
    return (
      <div className="border-t border-border pt-6">
        <p className="eyebrow text-gold-ink">{label}</p>
        <p className="font-display mt-4 text-3xl leading-none text-muted-foreground/70">
          Not published
        </p>
        <p className="caption mt-3 text-muted-foreground">
          Too few registered records here to publish this without describing individual
          transactions.
        </p>
      </div>
    );
  }

  const sorted = [...field].sort((a, b) => a - b);
  const lo = sorted[0] ?? value;
  const hi = sorted[sorted.length - 1] ?? value;
  /* A strip needs a range. One community publishing the metric is a dot, and
   * dividing by a zero-width range would put every mark at NaN%. */
  const flat = hi - lo < Number.EPSILON;
  const at = (given: number) => (flat ? 50 : ((given - lo) / (hi - lo)) * 100);

  /* Rank counts communities strictly ahead, so ties share a position rather
   * than being ordered by whatever the sort happened to do. Highest first,
   * because "3rd of 56" reads as near the top in every metric a reader cares
   * about the top of. */
  const ahead = field.filter((other) => other > value).length;
  const rank = ahead + 1;

  return (
    <div className="border-t border-border pt-6">
      <p className="eyebrow text-gold-ink">{label}</p>
      <p className="font-display mt-4 text-3xl leading-none tabular-nums lg:text-4xl">
        {format(value)}
      </p>
      <p className="caption mt-3 text-muted-foreground">{meaning}</p>

      {field.length > 3 ? (
        <div dir="ltr" className="mt-7">
          {/* Every community as a tick, this one as the mark. */}
          <div className="relative h-9" aria-hidden>
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            {sorted.map((other, index) => (
              <span
                key={`${other}-${index}`}
                className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--border-strong)]"
                style={{ left: `${at(other)}%` }}
              />
            ))}
            {dubai != null && dubai >= lo && dubai <= hi ? (
              <span
                className="absolute top-0 h-full w-px bg-[var(--gold-ink)]"
                style={{ left: `${at(dubai)}%` }}
              />
            ) : null}
            <span
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-[var(--green-mid)]"
              style={{ left: `${at(value)}%` }}
            />
          </div>

          <div className="mt-1 flex items-baseline justify-between gap-4">
            <span className="caption tabular-nums text-muted-foreground">{format(lo)}</span>
            <span className="caption tabular-nums text-muted-foreground">{format(hi)}</span>
          </div>

          <p className="caption mt-4">
            <span className="text-foreground">
              {rank === 1
                ? `Highest of ${field.length} communities.`
                : rank === field.length
                  ? `Lowest of ${field.length} communities.`
                  : `${ordinal(rank)} highest of ${field.length} communities.`}
            </span>{" "}
            {dubai != null ? (
              <span className="text-muted-foreground">{compare(value, dubai, figure.higherIs)}</span>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ordinal(value: number) {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const ones = value % 10;
  return `${value}${ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th"}`;
}

/** The legend, stated once above a group of strips rather than on each one. */
export function FigureContextKey({ className }: { className?: string }) {
  return (
    <p className={cn("caption flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      <span className="inline-flex items-center gap-2.5 text-muted-foreground">
        <span aria-hidden className="inline-block size-2.5 rounded-full bg-[var(--green-mid)]" />
        This community
      </span>
      <span className="inline-flex items-center gap-2.5 text-muted-foreground">
        <span aria-hidden className="inline-block h-3.5 w-px bg-[var(--gold-ink)]" />
        Dubai median
      </span>
      <span className="inline-flex items-center gap-2.5 text-muted-foreground">
        <span aria-hidden className="inline-block h-2.5 w-px bg-[var(--border-strong)]" />
        Every other community
      </span>
    </p>
  );
}
