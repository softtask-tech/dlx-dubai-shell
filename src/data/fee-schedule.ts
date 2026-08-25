/**
 * Dubai transaction fees, rates and visa thresholds.
 *
 * WHY THIS FILE EXISTS AS A FILE.
 *
 * Every number here is a real-world figure set by an authority, and every one
 * of them changes. Baked into a calculator's arithmetic they become invisible
 * claims that nobody can check and nobody remembers to update. Held here they
 * are explicit, dated, attributed, and, where a figure genuinely varies, the
 * calculator lets the visitor set their own instead of pretending ours is
 * authoritative.
 *
 * Three rules for anything added here:
 *
 *   1. `verifiedOn` is when a person last checked it against the source. It
 *      drives the "accurate as of" line on every page that uses the figure, so
 *      a stale entry tells on itself rather than quietly misinforming someone.
 *   2. `source` names who sets it. "The internet" is not a source.
 *   3. `editable: true` on anything that varies in practice. A fee that is
 *      negotiated, tiered, or building-specific must arrive as a default the
 *      visitor can change, not as a fact.
 *
 * DLX is not a legal, tax or immigration adviser. Nothing here is advice, and
 * every surface that renders these figures says so and points to the authority.
 */

export type FeeBasis =
  /** A percentage of the purchase price. */
  | "percent_of_price"
  /** A flat amount in AED. */
  | "flat_aed"
  /** A percentage of the annual rent. */
  | "percent_of_rent";

export type FeeEntry = {
  key: string;
  label: string;
  /** Percentage points (4 means 4%) or an AED amount, per `basis`. */
  value: number;
  basis: FeeBasis;
  /** What this actually is, in plain language. */
  note: string;
  /** Who sets it. */
  source: string;
  /** When a person last checked it. ISO date. */
  verifiedOn: string;
  /** True when the figure varies in practice and the visitor should set it. */
  editable: boolean;
  /** Only charged in some transactions. */
  optional?: boolean;
};

/** The date the whole schedule was last reviewed, for the page-level stamp. */
export const FEE_SCHEDULE_VERIFIED_ON = "2026-08-22";

/**
 * Purchase costs, on top of the price.
 *
 * The DLD transfer fee is the one genuinely fixed, universally applicable
 * figure. Everything else is a default: agency commission is negotiated,
 * developer NOC fees vary by developer, and mortgage-related costs only apply
 * if you are borrowing. All of them are editable for that reason.
 */
export const PURCHASE_FEES: readonly FeeEntry[] = [
  {
    key: "dld_transfer",
    label: "DLD transfer fee",
    value: 4,
    basis: "percent_of_price",
    note: "The Dubai Land Department's fee for registering the transfer into your name. Conventionally split between buyer and seller, but in practice the buyer usually pays it, assume you are paying it unless your contract says otherwise.",
    source: "Dubai Land Department",
    verifiedOn: "2026-08-22",
    editable: false,
  },
  {
    key: "agency_commission",
    label: "Agency commission",
    value: 2,
    basis: "percent_of_price",
    note: "The brokerage fee, conventionally 2% plus VAT. It is negotiable, and what you are paying should be agreed in writing before you commit to anything.",
    source: "Market convention, negotiated between the parties",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "trustee_office",
    label: "Registration trustee fee",
    value: 4200,
    basis: "flat_aed",
    note: "Paid to the registration trustee office that processes the transfer. Typically tiered by price band, so treat this as an estimate and confirm the exact figure with your trustee office.",
    source: "Registration trustee offices, tiered by price",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "developer_noc",
    label: "Developer NOC fee",
    value: 3000,
    basis: "flat_aed",
    note: "The developer's charge for the No Objection Certificate confirming service charges are settled. It varies substantially between developers, ask yours for the exact figure early, because it is a common late surprise.",
    source: "Set individually by each developer",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "title_deed",
    label: "Title deed issuance",
    value: 580,
    basis: "flat_aed",
    note: "The administrative charge for issuing the new title deed.",
    source: "Dubai Land Department",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "conveyancing",
    label: "Conveyancing",
    value: 6000,
    basis: "flat_aed",
    note: "Optional. A conveyancer handles the paperwork and protects your position through the transfer. Worth it on a first purchase or a remote one; fees vary by firm.",
    source: "Varies by conveyancing firm",
    verifiedOn: "2026-08-22",
    editable: true,
    optional: true,
  },
];

/**
 * Golden Visa thresholds.
 *
 * The criteria are set by the UAE authorities and they do change. These are
 * defaults for a rough indication only, the eligibility checker states plainly
 * that it is not a determination and routes every user to a licensed adviser
 * for written confirmation. DLX does not process visa applications.
 */
export const GOLDEN_VISA = {
  /** Property value at or above which the ten-year route is commonly cited. */
  propertyThresholdAed: 2_000_000,
  /** The shorter-duration route, where one applies. */
  shorterRouteThresholdAed: 750_000,
  source: "UAE Federal Authority for Identity, Citizenship, Customs and Port Security",
  verifiedOn: "2026-08-22",
  /**
   * The disclaimer shown wherever these numbers appear. Deliberately blunt:
   * someone making a residency decision on a web calculator needs to know
   * exactly how much weight it can carry.
   */
  disclaimer:
    "Thresholds and criteria are set by the UAE authorities and change. This is an indication, not an eligibility determination. DLX does not process visa applications. Confirm your position in writing with a licensed immigration adviser before committing to a purchase.",
} as const;

/**
 * Rental transaction costs.
 *
 * Agency commission on a tenancy is conventionally 5% of the annual rent, and
 * Ejari registration is the mandatory tenancy registration.
 */
export const RENTAL_FEES: readonly FeeEntry[] = [
  {
    key: "agency_commission_rent",
    label: "Agency commission",
    value: 5,
    basis: "percent_of_rent",
    note: "Conventionally 5% of the annual rent. Negotiable, and agreed in writing before you sign.",
    source: "Market convention, negotiated between the parties",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "ejari",
    label: "Ejari registration",
    value: 220,
    basis: "flat_aed",
    note: "Registering the tenancy contract with Ejari, which is required and is what makes the tenancy enforceable.",
    source: "Dubai Land Department",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  {
    key: "security_deposit",
    label: "Security deposit",
    value: 5,
    basis: "percent_of_rent",
    note: "Conventionally 5% of annual rent for an unfurnished property and 10% furnished. Refundable at the end of the tenancy, less any damage.",
    source: "Market convention",
    verifiedOn: "2026-08-22",
    editable: true,
  },
];

/**
 * Ongoing ownership costs used by the rent-vs-buy and ROI tools.
 *
 * Service charges are the big one and they are building-specific, a tower with
 * a chilled-water plant and a concierge costs multiples of a walk-up. The
 * default is a placeholder the visitor is expected to replace with the actual
 * figure for the building they are looking at, and the tools say so.
 */
export const HOLDING_COSTS = {
  serviceChargePerSqftAed: {
    value: 16,
    label: "Service charge",
    note: "Per square foot per year. Varies enormously by building, from single digits for a simple block to well over 30 for a serviced tower. Get the actual figure for your building before you rely on any yield calculation.",
    source: "Building-specific, published per project by the Dubai Land Department",
    verifiedOn: "2026-08-22",
    editable: true,
  },
  /** Typical annual allowance for maintenance and voids, as a share of rent. */
  maintenanceAndVoidsPercent: {
    value: 8,
    label: "Maintenance and voids",
    note: "An allowance for repairs and empty months between tenants, as a share of annual rent. A rule of thumb rather than a rate, and the reason gross yield always flatters net.",
    source: "DLX planning assumption",
    verifiedOn: "2026-08-22",
    editable: true,
  },
} as const;

/** Formats a fee entry's value for display. */
export function formatFeeValue(entry: FeeEntry): string {
  if (entry.basis === "flat_aed") {
    return `AED ${entry.value.toLocaleString("en-AE")}`;
  }
  return `${entry.value}%`;
}

/** Computes what a fee costs on a given price or rent. */
export function applyFee(entry: FeeEntry, amount: number): number {
  switch (entry.basis) {
    case "flat_aed":
      return entry.value;
    case "percent_of_price":
    case "percent_of_rent":
      return (amount * entry.value) / 100;
  }
}

/** The most recent verification date across a set of entries. */
export function latestVerifiedOn(entries: readonly { verifiedOn: string }[]): string {
  return entries.reduce(
    (latest, entry) => (entry.verifiedOn > latest ? entry.verifiedOn : latest),
    entries[0]?.verifiedOn ?? FEE_SCHEDULE_VERIFIED_ON,
  );
}
