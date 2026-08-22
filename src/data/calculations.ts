/**
 * The arithmetic behind the calculators.
 *
 * Kept as pure functions, apart from the components that render them, so the
 * maths can be checked directly. A calculator on a brokerage site is a claim
 * about someone's money; the claim should be testable.
 *
 * Every function returns its workings alongside its answer, because the
 * calculators show them.
 */
import { applyFee, GOLDEN_VISA, type FeeEntry } from "./fee-schedule";

/* ------------------------------------------------------------------ yield -- */

export type YieldInput = {
  purchasePriceAed: number;
  annualRentAed: number;
  /** Internal area, used with the per-square-foot service charge. */
  areaSqft: number;
  serviceChargePerSqft: number;
  /** Maintenance and voids, as a percentage of annual rent. */
  maintenanceAndVoidsPercent: number;
};

export type YieldResult = {
  grossYieldPct: number | null;
  netYieldPct: number | null;
  annualServiceCharge: number;
  annualMaintenanceAndVoids: number;
  netAnnualIncome: number;
  /** Years of net income to return the purchase price. */
  paybackYears: number | null;
};

export function calculateYield(input: YieldInput): YieldResult {
  const annualServiceCharge = Math.max(0, input.areaSqft * input.serviceChargePerSqft);
  const annualMaintenanceAndVoids = Math.max(
    0,
    (input.annualRentAed * input.maintenanceAndVoidsPercent) / 100,
  );
  const netAnnualIncome = input.annualRentAed - annualServiceCharge - annualMaintenanceAndVoids;

  /* A zero price is not a 0% yield, it is an unanswerable question. */
  const canDivide = input.purchasePriceAed > 0;

  return {
    grossYieldPct: canDivide ? (input.annualRentAed / input.purchasePriceAed) * 100 : null,
    netYieldPct: canDivide ? (netAnnualIncome / input.purchasePriceAed) * 100 : null,
    annualServiceCharge,
    annualMaintenanceAndVoids,
    netAnnualIncome,
    paybackYears: netAnnualIncome > 0 ? input.purchasePriceAed / netAnnualIncome : null,
  };
}

/* ---------------------------------------------------------- buying costs -- */

export type CostLine = { key: string; label: string; amount: number; note: string };

export type BuyingCostResult = {
  lines: CostLine[];
  totalFees: number;
  totalOutlay: number;
  feesAsPercent: number | null;
};

/**
 * Totals the cost of a purchase.
 *
 * `overrides` carries whatever the visitor changed, keyed by fee. The schedule
 * supplies defaults and provenance; the visitor supplies reality.
 */
export function calculateBuyingCosts(
  priceAed: number,
  fees: readonly FeeEntry[],
  overrides: Record<string, number> = {},
  excluded: ReadonlySet<string> = new Set(),
): BuyingCostResult {
  const lines: CostLine[] = [];

  for (const fee of fees) {
    if (excluded.has(fee.key)) continue;
    const value = overrides[fee.key] ?? fee.value;
    const amount = applyFee({ ...fee, value }, priceAed);
    lines.push({ key: fee.key, label: fee.label, amount, note: fee.note });
  }

  const totalFees = lines.reduce((sum, line) => sum + line.amount, 0);

  return {
    lines,
    totalFees,
    totalOutlay: priceAed + totalFees,
    feesAsPercent: priceAed > 0 ? (totalFees / priceAed) * 100 : null,
  };
}

/* ----------------------------------------------------------- rent vs buy -- */

export type RentVsBuyInput = {
  purchasePriceAed: number;
  annualRentAed: number;
  upfrontCostsAed: number;
  annualServiceChargeAed: number;
  /** Assumed annual capital growth, as a percentage. */
  priceGrowthPct: number;
  /** Assumed annual rent inflation, as a percentage. */
  rentGrowthPct: number;
  /** Cost of selling at the end, as a percentage of the sale price. */
  sellingCostsPct: number;
  years: number;
};

export type RentVsBuyYear = {
  year: number;
  cumulativeRentPaid: number;
  /** Buying's net position: costs paid out, less equity gained. */
  buyingNetCost: number;
  /** Positive once buying has cost less than renting. */
  advantageOfBuying: number;
};

export type RentVsBuyResult = {
  years: RentVsBuyYear[];
  /** The first year buying comes out ahead, or null within the horizon. */
  breakEvenYear: number | null;
};

/**
 * Compares renting with buying, year by year.
 *
 * Deliberately a cash comparison rather than a full investment model: no
 * mortgage (there is no mortgage calculator here by design), and no attempt to
 * model what a renter might earn by investing the difference. Adding those
 * would make it look more authoritative without making it more true, since both
 * depend on assumptions nobody can stand behind.
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const years: RentVsBuyYear[] = [];
  let cumulativeRent = 0;
  let cumulativeOwnershipCosts = input.upfrontCostsAed;
  let breakEvenYear: number | null = null;

  for (let year = 1; year <= input.years; year++) {
    /* Rent rises each year; the first year is at today's rent. */
    cumulativeRent += input.annualRentAed * Math.pow(1 + input.rentGrowthPct / 100, year - 1);
    cumulativeOwnershipCosts += input.annualServiceChargeAed;

    const propertyValue = input.purchasePriceAed * Math.pow(1 + input.priceGrowthPct / 100, year);
    const saleCosts = propertyValue * (input.sellingCostsPct / 100);
    /* Equity gained is what selling would return, less what was put in. */
    const equityGained = propertyValue - saleCosts - input.purchasePriceAed;

    const buyingNetCost = cumulativeOwnershipCosts - equityGained;
    const advantage = cumulativeRent - buyingNetCost;

    if (breakEvenYear === null && advantage > 0) breakEvenYear = year;

    years.push({
      year,
      cumulativeRentPaid: cumulativeRent,
      buyingNetCost,
      advantageOfBuying: advantage,
    });
  }

  return { years, breakEvenYear };
}

/* --------------------------------------------------------- payment plan -- */

export type PaymentPlanInput = {
  purchasePriceAed: number;
  downPaymentPct: number;
  /** Instalments between booking and handover. */
  constructionInstalments: number;
  /** Share of the price paid across those instalments. */
  duringConstructionPct: number;
  /** Share due at handover. */
  onHandoverPct: number;
  /** Instalments after handover, if the plan has them. */
  postHandoverInstalments: number;
  /** Months from today until handover. */
  monthsToHandover: number;
};

export type PaymentMilestone = {
  label: string;
  /** Months from today. */
  monthsFromNow: number;
  amount: number;
  percentOfPrice: number;
  phase: "booking" | "construction" | "handover" | "post_handover";
};

export type PaymentPlanResult = {
  milestones: PaymentMilestone[];
  /** Everything due on or before handover — the number that decides affordability. */
  dueBeforeHandover: number;
  dueAfterHandover: number;
  /** True when the percentages do not add to 100. */
  isUnbalanced: boolean;
  totalPercent: number;
};

/**
 * Turns a payment plan into dates and amounts.
 *
 * The figure that matters is what falls due before handover: a "60/40" plan
 * where the 60 is spread over three years is a different proposition from one
 * where most of it lands in the first six months.
 */
export function buildPaymentPlan(input: PaymentPlanInput): PaymentPlanResult {
  const milestones: PaymentMilestone[] = [];
  const postHandoverPct = Math.max(
    0,
    100 - input.downPaymentPct - input.duringConstructionPct - input.onHandoverPct,
  );

  const amountFor = (percent: number) => (input.purchasePriceAed * percent) / 100;

  milestones.push({
    label: "Booking",
    monthsFromNow: 0,
    amount: amountFor(input.downPaymentPct),
    percentOfPrice: input.downPaymentPct,
    phase: "booking",
  });

  if (input.constructionInstalments > 0 && input.duringConstructionPct > 0) {
    const each = input.duringConstructionPct / input.constructionInstalments;
    const spacing = input.monthsToHandover / (input.constructionInstalments + 1);
    for (let i = 1; i <= input.constructionInstalments; i++) {
      milestones.push({
        label: `Construction instalment ${i}`,
        monthsFromNow: Math.round(spacing * i),
        amount: amountFor(each),
        percentOfPrice: each,
        phase: "construction",
      });
    }
  }

  if (input.onHandoverPct > 0) {
    milestones.push({
      label: "Handover",
      monthsFromNow: input.monthsToHandover,
      amount: amountFor(input.onHandoverPct),
      percentOfPrice: input.onHandoverPct,
      phase: "handover",
    });
  }

  if (input.postHandoverInstalments > 0 && postHandoverPct > 0) {
    const each = postHandoverPct / input.postHandoverInstalments;
    for (let i = 1; i <= input.postHandoverInstalments; i++) {
      milestones.push({
        label: `Post-handover instalment ${i}`,
        /* Post-handover instalments are conventionally quarterly. */
        monthsFromNow: input.monthsToHandover + i * 3,
        amount: amountFor(each),
        percentOfPrice: each,
        phase: "post_handover",
      });
    }
  }

  const dueBeforeHandover = milestones
    .filter((milestone) => milestone.phase !== "post_handover")
    .reduce((sum, milestone) => sum + milestone.amount, 0);

  /*
   * Balance is measured against the milestones actually scheduled, not against
   * the percentages typed in. Those two differ in a case that is easy to hit:
   * a plan with a remainder but no post-handover instalments to put it in. The
   * declared percentages still sum to 100 while the schedule shown accounts for
   * less than the price — which is exactly the silent misread this warning
   * exists to catch.
   */
  const totalPercent = milestones.reduce((sum, milestone) => sum + milestone.percentOfPrice, 0);

  return {
    milestones,
    dueBeforeHandover,
    dueAfterHandover: milestones
      .filter((milestone) => milestone.phase === "post_handover")
      .reduce((sum, milestone) => sum + milestone.amount, 0),
    /* Guards against a plan whose parts do not add up, which is easy to type. */
    isUnbalanced: Math.abs(totalPercent - 100) > 0.01,
    totalPercent,
  };
}

/* --------------------------------------------------------- golden visa -- */

export type GoldenVisaInput = {
  propertyValueAed: number;
  /** True where the property is owned outright rather than mortgaged. */
  ownedOutright: boolean;
  isOffPlan: boolean;
  spouse: boolean;
  children: number;
};

export type GoldenVisaIndication = {
  /** Which commonly cited route the value reaches, if any. */
  route: "long_term" | "shorter_term" | "below_threshold";
  routeLabel: string;
  /** Shortfall to the next route up, when there is one. */
  shortfallToNextAed: number | null;
  /** Points to raise with a licensed adviser — never presented as conclusions. */
  considerations: string[];
  /** Who the holder could typically sponsor, stated as a question to confirm. */
  sponsorship: string[];
};

/**
 * Indicates where a purchase sits against the commonly cited property routes.
 *
 * This deliberately does not return "eligible". Eligibility is determined by
 * the UAE authorities on the whole application, criteria change, and a website
 * telling someone they qualify is how people end up committing to a purchase on
 * a false premise. Everything below is framed as what to confirm.
 */
export function indicateGoldenVisa(input: GoldenVisaInput): GoldenVisaIndication {
  const considerations: string[] = [];

  const route: GoldenVisaIndication["route"] =
    input.propertyValueAed >= GOLDEN_VISA.propertyThresholdAed
      ? "long_term"
      : input.propertyValueAed >= GOLDEN_VISA.shorterRouteThresholdAed
        ? "shorter_term"
        : "below_threshold";

  const routeLabel =
    route === "long_term"
      ? "Reaches the commonly cited long-term property route"
      : route === "shorter_term"
        ? "Reaches a shorter-duration route, not the long-term one"
        : "Below the commonly cited property thresholds";

  const shortfallToNextAed =
    route === "long_term"
      ? null
      : route === "shorter_term"
        ? GOLDEN_VISA.propertyThresholdAed - input.propertyValueAed
        : GOLDEN_VISA.shorterRouteThresholdAed - input.propertyValueAed;

  if (!input.ownedOutright) {
    considerations.push(
      "The property is mortgaged. Financed purchases can carry additional conditions — confirm what your lender's involvement means for the application before you commit.",
    );
  }

  if (input.isOffPlan) {
    considerations.push(
      "This is off-plan. Requirements around completion and title registration differ from a ready property, and timing matters — ask your adviser what has to be in place before you can apply.",
    );
  }

  if (route === "below_threshold") {
    considerations.push(
      "Property is only one of several routes to a Golden Visa. Others exist for professionals, investors and specialists, and may suit you better than increasing your purchase.",
    );
  }

  considerations.push(
    "Criteria, thresholds and documentation are set by the UAE authorities and change. Have your position confirmed in writing by a licensed immigration adviser before you rely on it.",
  );

  const sponsorship: string[] = [];
  if (route !== "below_threshold") {
    if (input.spouse)
      sponsorship.push("A spouse can generally be sponsored — confirm the documentation required.");
    if (input.children > 0) {
      sponsorship.push(
        `${input.children} ${input.children === 1 ? "child" : "children"} — sponsorship of children is generally available, though age and dependency conditions apply and are worth confirming early.`,
      );
    }
    sponsorship.push(
      "Domestic staff can be sponsored in some circumstances, subject to conditions.",
    );
  }

  return { route, routeLabel, shortfallToNextAed, considerations, sponsorship };
}
