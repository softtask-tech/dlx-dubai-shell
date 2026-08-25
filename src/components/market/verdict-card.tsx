import type { AreaStats } from "@/data/market-types";
import { Eyebrow } from "@/components/ui/section";

/**
 * "Should I buy here?"
 *
 * The question every visitor is actually asking, answered from the numbers
 * rather than dodged. It is a reading of the evidence, not advice, the card
 * says so, shows the three signals it weighed, and sends anyone serious to a
 * consultant.
 *
 * The honest failure mode matters here: with too little data the card says the
 * evidence is thin rather than manufacturing a confident verdict from twelve
 * transactions.
 */

type Signal = { label: string; reading: string; positive: boolean | null };

const THIN_EVIDENCE = 30;

export function VerdictCard({ areaName, stats }: { areaName: string; stats: AreaStats | null }) {
  if (!stats || stats.transaction_count < THIN_EVIDENCE) {
    return (
      <div className="border border-border p-8">
        <Eyebrow>Should I buy here?</Eyebrow>
        <p className="display-3 mt-5">Not enough evidence yet.</p>
        <p className="body-text mt-5 text-muted-foreground">
          We hold {stats?.transaction_count ?? 0} recorded sales for {areaName} over the last year,
          too few to draw a conclusion from without misleading you. Ask us directly and we will tell
          you what we are seeing on the ground.
        </p>
      </div>
    );
  }

  const signals: Signal[] = [];

  if (stats.yoy_price_change_pct !== null) {
    const rising = stats.yoy_price_change_pct >= 0;
    signals.push({
      label: "Price direction",
      reading: rising
        ? `Up ${stats.yoy_price_change_pct.toFixed(1)}% on last year. Buyers here have been paying more, not less.`
        : `Down ${Math.abs(stats.yoy_price_change_pct).toFixed(1)}% on last year. There is room to negotiate that there was not.`,
      positive: rising,
    });
  }

  if (stats.yoy_volume_change_pct !== null) {
    const busier = stats.yoy_volume_change_pct >= 0;
    signals.push({
      label: "Liquidity",
      reading: busier
        ? `${stats.yoy_volume_change_pct.toFixed(0)}% more sales than last year. A liquid community is one you can exit.`
        : `${Math.abs(stats.yoy_volume_change_pct).toFixed(0)}% fewer sales than last year. Slower to sell when your turn comes.`,
      positive: busier,
    });
  }

  if (stats.gross_yield_pct !== null) {
    const strong = stats.gross_yield_pct >= 6;
    signals.push({
      label: "Rental return",
      reading: `${stats.gross_yield_pct.toFixed(1)}% gross${strong ? ", strong for prime Dubai" : ""}, before service charges. ${
        strong
          ? "It should cover a mortgage more comfortably than most."
          : "Buy here for the asset and the location rather than the income."
      }`,
      positive: strong,
    });
  }

  const positives = signals.filter((signal) => signal.positive === true).length;
  const negatives = signals.filter((signal) => signal.positive === false).length;

  const verdict =
    positives > negatives
      ? { headline: "The evidence is in its favour.", tone: "positive" as const }
      : negatives > positives
        ? { headline: "Go in with your eyes open.", tone: "cautious" as const }
        : { headline: "It depends what you want from it.", tone: "mixed" as const };

  return (
    <div className="border border-border p-8">
      <Eyebrow>Should I buy here?</Eyebrow>
      <p className="display-3 mt-5">{verdict.headline}</p>

      <dl className="mt-8">
        {signals.map((signal) => (
          <div key={signal.label} className="border-t border-border/60 py-5">
            <dt className="eyebrow flex items-center gap-3">
              <span
                aria-hidden="true"
                className={
                  signal.positive === true
                    ? "h-1.5 w-1.5 rounded-full bg-accent"
                    : "h-1.5 w-1.5 rounded-full bg-foreground/30"
                }
              />
              {signal.label}
            </dt>
            <dd className="body-text mt-2 text-muted-foreground">{signal.reading}</dd>
          </div>
        ))}
      </dl>

      <p className="caption mt-8">
        A reading of the recorded evidence for {areaName}, not personal advice. What is right for
        you depends on your horizon, your financing and your tax position, which is a conversation,
        not a card.
      </p>
    </div>
  );
}
