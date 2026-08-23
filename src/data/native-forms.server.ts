/**
 * Leads that arrive from inside an ad platform.
 *
 * Meta Instant Forms and Google Lead Forms never send the visitor to the site,
 * which is exactly why they convert well and exactly why they are dangerous:
 * the enquiry lands in a platform's own inbox, someone exports a CSV on Friday,
 * and a lead that wanted a call on Monday goes cold in a spreadsheet.
 *
 * These endpoints put them into the same inbox as everything else within
 * seconds of submission — same scoring, same routing, same two emails — so the
 * channel changes where a lead came from and nothing else about how it is
 * handled.
 *
 * MAPPING IS THE HARD PART. Platform forms return whatever questions the
 * campaign happened to ask, keyed by the label someone typed into an ad
 * manager. So the mapping is done on normalised label *patterns* rather than
 * exact strings, and anything unrecognised is kept verbatim in the
 * qualification answers rather than dropped — a consultant reading "Which
 * community?  → Palm Jumeirah" is better served than one reading nothing.
 */
import type { LeadIntent, LeadTimeline } from "./types";
import type { LeadSubmission } from "./leads.server";

export type NativeField = { name: string; values: string[] };

/** A platform answer, normalised for matching. */
function normalise(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const EMAIL_LABELS = ["email", "email address", "e mail", "work email"];
const PHONE_LABELS = [
  "phone",
  "phone number",
  "mobile",
  "mobile number",
  "whatsapp",
  "contact number",
];
const NAME_LABELS = ["full name", "name", "first name", "your name"];
const LAST_NAME_LABELS = ["last name", "surname", "family name"];

/** Free-text answers mapped onto our own enums, by what they contain. */
const INTENT_PATTERNS: ReadonlyArray<[RegExp, LeadIntent]> = [
  [/invest|rental income|yield|portfolio/, "invest"],
  [/sell|valuation|list my/, "sell"],
  [/rent(?!al income)|lease|tenant/, "rent"],
  [/reloc|move|visa|residen|family/, "relocate"],
  [/buy|purchase|own|home/, "buy"],
];

const TIMELINE_PATTERNS: ReadonlyArray<[RegExp, LeadTimeline]> = [
  [/immediate|now|asap|ready|this month/, "immediately"],
  [/1 ?- ?3|three months|3 months|quarter/, "within_3_months"],
  [/6 months|this year|12 months|within a year/, "within_12_months"],
  [/research|explor|just look|not sure|no rush/, "researching"],
];

/** "AED 2,000,000", "2m", "1-3 million" → a number in AED, or null. */
export function parseBudget(value: string): number | null {
  const text = value.toLowerCase().replace(/,/g, "");
  const match = text.match(/(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  if (!match?.[1]) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2];
  if (unit === "m" || unit === "million") return amount * 1_000_000;
  if (unit === "k" || unit === "thousand") return amount * 1000;
  /* A bare number under a thousand on a Dubai property form means millions —
   * nobody is enquiring with a budget of four dirhams. */
  return amount < 1000 ? amount * 1_000_000 : amount;
}

export type MappedLead = {
  submission: Omit<LeadSubmission, "sourceType"> & { sourceType: string };
  /** Answers we could not map, kept for the consultant to read. */
  unmapped: Record<string, string>;
};

/**
 * Turns a platform's field list into a lead submission.
 *
 * Everything unrecognised survives into `qualificationAnswers`. A campaign that
 * asked "Which community interests you?" produces an answer worth more to the
 * consultant than most of the fields we do map, and dropping it because the
 * code had no column for it would be the wrong trade.
 */
export function mapNativeFields(input: {
  fields: readonly NativeField[];
  platform: "meta" | "google";
  formId: string;
  externalLeadId: string;
  campaignId?: string | null;
  adId?: string | null;
}): MappedLead {
  const unmapped: Record<string, string> = {};
  let fullName: string | undefined;
  let lastName: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  let intent: LeadIntent | undefined;
  let timeline: LeadTimeline | undefined;
  let budgetMax: number | undefined;
  const notes: string[] = [];

  for (const field of input.fields) {
    const label = normalise(field.name);
    const value = field.values.filter(Boolean).join(", ").trim();
    if (!value) continue;

    if (EMAIL_LABELS.includes(label)) {
      email = value;
      continue;
    }
    if (PHONE_LABELS.includes(label)) {
      phone = value;
      continue;
    }
    if (NAME_LABELS.includes(label)) {
      fullName = value;
      continue;
    }
    if (LAST_NAME_LABELS.includes(label)) {
      lastName = value;
      continue;
    }

    const lowered = value.toLowerCase();

    if (/budget|price|spend|invest.*amount/.test(label)) {
      const parsed = parseBudget(value);
      if (parsed) budgetMax = parsed;
      notes.push(`${field.name}: ${value}`);
      continue;
    }

    if (/when|timeline|time frame|timescale|how soon/.test(label)) {
      timeline = TIMELINE_PATTERNS.find(([pattern]) => pattern.test(lowered))?.[1];
      notes.push(`${field.name}: ${value}`);
      continue;
    }

    if (/looking to|interested in|purpose|what are you|intent/.test(label)) {
      intent = INTENT_PATTERNS.find(([pattern]) => pattern.test(lowered))?.[1];
      notes.push(`${field.name}: ${value}`);
      continue;
    }

    unmapped[field.name] = value;
    notes.push(`${field.name}: ${value}`);
  }

  const name = [fullName, lastName].filter(Boolean).join(" ").trim();

  return {
    submission: {
      ...(name ? { fullName: name } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(intent ? { intent } : {}),
      ...(timeline ? { timeline } : {}),
      ...(budgetMax ? { budgetMax, budgetCurrency: "AED" } : {}),
      /* The campaign's own questions, as the consultant will want to read them. */
      ...(notes.length > 0 ? { message: notes.join("\n") } : {}),
      sourceType: "other",
      sourceDetail: `${input.platform}-form-${input.formId}`,
      utmSource: input.platform === "meta" ? "facebook" : "google",
      utmMedium: "paid-social-lead-form",
      ...(input.campaignId ? { utmCampaign: input.campaignId } : {}),
      ...(input.adId ? { utmContent: input.adId } : {}),
      qualificationAnswers: {
        native_platform: input.platform,
        native_form_id: input.formId,
        native_lead_id: input.externalLeadId,
        ...unmapped,
      },
    },
    unmapped,
  };
}

/**
 * Verifies Meta's webhook signature.
 *
 * `X-Hub-Signature-256` is an HMAC of the raw body with the app secret. It has
 * to be checked against the *raw* bytes — re-serialising the parsed JSON
 * changes key order and whitespace, and the signature no longer matches, which
 * is the classic reason this check gets disabled by a frustrated developer and
 * the endpoint ends up open to anyone.
 */
export async function verifyMetaSignature(
  rawBody: string,
  header: string | null,
): Promise<boolean> {
  const secret = process.env["META_APP_SECRET"];
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  const provided = header.slice("sha256=".length);

  /* Constant-time comparison: a fast reject on the first differing character
   * leaks how much of a forged signature was correct. */
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Fetches the actual answers for a Meta leadgen id. */
export async function fetchMetaLead(
  leadgenId: string,
): Promise<{ fields: NativeField[]; formId: string; adId?: string; campaignId?: string } | null> {
  const token = process.env["META_PAGE_ACCESS_TOKEN"];
  if (!token) {
    console.error("[native-forms] META_PAGE_ACCESS_TOKEN is not set; cannot read the lead");
    return null;
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${leadgenId}?fields=field_data,form_id,ad_id,campaign_id&access_token=${encodeURIComponent(token)}`,
    { signal: AbortSignal.timeout(10_000) },
  );

  if (!response.ok) {
    console.error(`[native-forms] Meta returned ${response.status} for lead ${leadgenId}`);
    return null;
  }

  const payload = (await response.json()) as {
    field_data?: Array<{ name: string; values: string[] }>;
    form_id?: string;
    ad_id?: string;
    campaign_id?: string;
  };

  return {
    fields: (payload.field_data ?? []).map((field) => ({
      name: field.name,
      values: field.values ?? [],
    })),
    formId: payload.form_id ?? "unknown",
    ...(payload.ad_id ? { adId: payload.ad_id } : {}),
    ...(payload.campaign_id ? { campaignId: payload.campaign_id } : {}),
  };
}
