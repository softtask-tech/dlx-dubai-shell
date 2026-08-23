/**
 * Lead scoring.
 *
 * A lead's temperature is what decides whether a consultant calls within the
 * hour or the lead waits for the weekly sweep, so the rules are kept here in
 * one readable place rather than spread across forms — and they run on the
 * server, so a visitor cannot post themselves a score.
 *
 * The scale is 0–100 and deliberately coarse. It ranks the queue; it does not
 * pretend to predict anything.
 */
import type { LeadIntent, LeadTemperature, LeadTimeline } from "./types";

export type ScoreInput = {
  intent?: LeadIntent | null;
  /**
   * Where the enquiry came from.
   *
   * Not a judgement about the channel — a paid click is not worth more than an
   * organic one, and scoring it that way would flatter whichever budget is
   * currently largest. It is a judgement about *effort*: someone who ran a
   * yield calculation or asked for a market report before getting in touch has
   * demonstrably done work, and that is a real signal about the person.
   */
  sourceType?: string | null;
  timeline?: LeadTimeline | null;
  budgetMax?: number | null;
  /** AED. Used together with budgetMax when a range was given. */
  budgetMin?: number | null;
  hasPhone: boolean;
  hasEmail: boolean;
  isFinancing?: boolean | null;
  message?: string | null;
};

export type ScoreResult = {
  score: number;
  temperature: LeadTemperature;
  /** Why it scored what it did — shown in the admin inbox. */
  reasons: string[];
};

/** How soon they want to move is the strongest single signal. */
const TIMELINE_POINTS: Record<LeadTimeline, number> = {
  immediately: 35,
  within_3_months: 26,
  within_12_months: 14,
  researching: 4,
};

/** What they want to do. Selling and buying are the transactions we earn on. */
const INTENT_POINTS: Record<LeadIntent, number> = {
  sell: 22,
  buy: 20,
  invest: 20,
  relocate: 14,
  rent: 10,
  advice: 6,
};

type BudgetBand = { from: number; points: number; label: string };

/** Purchase budgets in AED, highest first. */
const PURCHASE_BANDS: readonly BudgetBand[] = [
  { from: 10_000_000, points: 25, label: "Budget above AED 10M" },
  { from: 5_000_000, points: 21, label: "Budget AED 5–10M" },
  { from: 2_000_000, points: 16, label: "Budget AED 2–5M" },
  { from: 750_000, points: 10, label: "Budget AED 750k–2M" },
  { from: 1, points: 5, label: "Budget stated" },
];

/**
 * Rental budgets, quoted per year as Dubai does.
 *
 * A separate table because the two are three orders of magnitude apart: score a
 * yearly rent against the purchase bands and every rental enquiry lands at the
 * bottom, however serious the client. AED 300k a year is a prime tenancy, not a
 * rounding error.
 */
const RENTAL_BANDS: readonly BudgetBand[] = [
  { from: 500_000, points: 25, label: "Rent above AED 500k/year" },
  { from: 250_000, points: 21, label: "Rent AED 250–500k/year" },
  { from: 120_000, points: 16, label: "Rent AED 120–250k/year" },
  { from: 60_000, points: 10, label: "Rent AED 60–120k/year" },
  { from: 1, points: 5, label: "Budget stated" },
];

export function scoreLead(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.timeline) {
    score += TIMELINE_POINTS[input.timeline];
    reasons.push(`Timeline: ${input.timeline.replace(/_/g, " ")}`);
  }

  if (input.intent) {
    score += INTENT_POINTS[input.intent];
    reasons.push(`Intent: ${input.intent}`);
  }

  /* Score the top of a stated range — it is what the client is reaching for. */
  const budget = input.budgetMax ?? input.budgetMin ?? null;
  if (budget && budget > 0) {
    const bands = input.intent === "rent" ? RENTAL_BANDS : PURCHASE_BANDS;
    const band = bands.find((b) => budget >= b.from);
    if (band) {
      score += band.points;
      reasons.push(band.label);
    }
  }

  /* A phone number is a materially stronger signal of intent than an email. */
  if (input.hasPhone) {
    score += 10;
    reasons.push("Phone number given");
  }
  if (input.hasEmail) score += 4;

  /* Someone who wrote a real message has thought about it. */
  if (input.message && input.message.trim().length >= 40) {
    score += 5;
    reasons.push("Wrote a detailed message");
  }

  /* Cash buyers move faster than financed ones — a small nudge, not a verdict. */
  if (input.isFinancing === false) {
    score += 4;
    reasons.push("Not requiring finance");
  }

  /*
   * Effort spent before making contact. A visitor who worked out their own
   * buying costs, or wanted the numbers behind a community, arrives further
   * along than one who filled in a contact form — and further along than the
   * same person would have been from any channel.
   */
  const EFFORT: Record<string, { points: number; label: string }> = {
    calculator: { points: 8, label: "Ran a calculator first" },
    market_report: { points: 8, label: "Asked for a market report" },
    valuation_form: { points: 8, label: "Asked for a valuation" },
    listing_enquiry: { points: 6, label: "Enquired about a specific property" },
    ai_chat: { points: 5, label: "Talked to the advisor first" },
    voice_call: { points: 12, label: "Picked up the phone" },
  };

  const effort = input.sourceType ? EFFORT[input.sourceType] : undefined;
  if (effort) {
    score += effort.points;
    reasons.push(effort.label);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, temperature: temperatureFor(score), reasons };
}

/**
 * Hot: call today. Warm: call this week. Cold: nurture.
 * The thresholds are set so that a clear timeline plus a real budget lands hot.
 */
export function temperatureFor(score: number): LeadTemperature {
  if (score >= 65) return "hot";
  if (score >= 35) return "warm";
  return "cold";
}
