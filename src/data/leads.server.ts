/**
 * Lead submission, server side only.
 *
 * Everything that decides a lead's value happens here rather than in the
 * browser: the score is computed server-side so a visitor cannot post
 * themselves "hot", and the email dispatch runs with credentials the client
 * never sees.
 *
 * The insert uses the service-role client because it also writes the score and
 * dispatch timestamps, which the public insert policy has no business allowing.
 */
import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import type { PaidMediaDatabase } from "./paid-media-types";
import { scoreLead } from "./lead-scoring";
import type { JsonObject, Lead, LeadSourceType } from "./types";

/** Trims a string and turns "" into undefined, so blanks never reach the row. */
const trimmed = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const leadSubmissionSchema = z
  .object({
    fullName: trimmed,
    email: trimmed.pipe(z.string().email().optional()),
    phone: trimmed,
    countryCode: trimmed,
    preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),

    intent: z.enum(["buy", "sell", "rent", "invest", "relocate", "advice"]).optional(),
    timeline: z
      .enum(["immediately", "within_3_months", "within_12_months", "researching"])
      .optional(),
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().nonnegative().optional(),
    budgetCurrency: z.string().length(3).optional(),
    propertyTypes: z.array(z.string()).optional(),
    bedroomsMin: z.number().int().nonnegative().optional(),
    isFinancing: z.boolean().optional(),
    message: trimmed,
    marketingConsent: z.boolean().optional(),

    /* Where the enquiry came from. */
    sourceType: z.string(),
    sourceDetail: trimmed,
    propertyId: z.string().uuid().optional(),
    guideId: z.string().uuid().optional(),

    /* Attribution, captured by the form from the URL and document. */
    utmSource: trimmed,
    utmMedium: trimmed,
    utmCampaign: trimmed,
    utmTerm: trimmed,
    utmContent: trimmed,
    referrerUrl: trimmed,
    landingPageUrl: trimmed,
    pagePath: trimmed,
    fbclid: trimmed,
    gclid: trimmed,
    /* Meta matches far better on the click *and* browser ids together than on
     * hashed contact details alone, and Google's newer click ids replace gclid
     * entirely on iOS. Captured because they are worthless if collected late. */
    fbc: trimmed,
    fbp: trimmed,
    gbraid: trimmed,
    wbraid: trimmed,
    msclkid: trimmed,
    ttclid: trimmed,
    firstUtmSource: trimmed,
    firstUtmMedium: trimmed,
    firstUtmCampaign: trimmed,
    firstLandingPageUrl: trimmed,
    firstSeenAt: trimmed,

    /* Anything a specific form asked that has no column of its own. */
    qualificationAnswers: z.record(z.string(), z.unknown()).optional(),

    /*
     * The browser's deduplication id for this conversion. Passed through so the
     * server's Conversions API call carries the same one, without it the same
     * lead is counted by Meta twice, and a campaign looks twice as good as it
     * is, which is worse than not measuring at all.
     */
    eventId: z.string().max(64).optional(),

    /* The Turnstile token, when the widget is configured. */
    turnstileToken: z.string().max(4000).optional(),

    /* Honeypot: a real person never fills this in. */
    company: z.string().optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Give us an email address or a phone number so we can reply.",
    path: ["email"],
  });

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

export type LeadSubmissionResult = {
  ok: true;
  leadId: string;
  temperature: Lead["temperature"];
  /**
   * Set when the enquiry was a report request: the token that unlocks it.
   * Returning it immediately means the reader gets what they asked for in the
   * same breath, rather than waiting on an email that may take minutes.
   */
  reportToken?: string;
};

/**
 * Writes a lead and dispatches the two emails.
 *
 * Email failure never fails the submission: the enquiry is already saved, and
 * losing it because Resend had a bad minute would be the worse outcome. The
 * failure is logged and the lead's `admin_notified_at` stays null, which is
 * what the inbox surfaces.
 */
export async function submitLead(input: LeadSubmission): Promise<LeadSubmissionResult> {
  /* A filled honeypot is a bot. Answer as though it worked and write nothing. */
  if (input.company && input.company.trim().length > 0) {
    return { ok: true, leadId: "00000000-0000-0000-0000-000000000000", temperature: "cold" };
  }

  const supabaseAdmin = await adminDb();

  /*
   * Assess before scoring. A submission that fails hard is still recorded,
   * flagged, not deleted, because a spam filter with no appeal quietly loses
   * real business, and someone has to be able to find the one it got wrong.
   */
  const { assessSubmission, dedupeKeyFor, isDuplicate } = await import("./spam.server");

  const verdict = await assessSubmission({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    message: input.message,
    turnstileToken: input.turnstileToken,
    sourceType: input.sourceType,
  });

  const dedupeKey = await dedupeKeyFor({
    email: input.email,
    phone: input.phone,
    sourceType: input.sourceType,
  });

  /*
   * A repeat within the window is answered as though it worked and written
   * nowhere. Someone who pressed submit twice should see success, not an error
   * telling them off, and the consultant should see one lead, not two.
   */
  if (dedupeKey && (await isDuplicate(dedupeKey))) {
    return { ok: true, leadId: "00000000-0000-0000-0000-000000000000", temperature: "cold" };
  }

  const { score, temperature, reasons } = scoreLead({
    intent: input.intent ?? null,
    timeline: input.timeline ?? null,
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    hasPhone: Boolean(input.phone),
    hasEmail: Boolean(input.email),
    isFinancing: input.isFinancing ?? null,
    message: input.message ?? null,
    sourceType: input.sourceType,
  });

  const row = {
    full_name: input.fullName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    country_code: input.countryCode ?? null,
    preferred_contact: input.preferredContact ?? null,
    intent: input.intent ?? null,
    timeline: input.timeline ?? null,
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    budget_currency: input.budgetCurrency ?? "AED",
    property_types: (input.propertyTypes ?? []) as Lead["property_types"],
    bedrooms_min: input.bedroomsMin ?? null,
    is_financing: input.isFinancing ?? null,
    message: input.message ?? null,
    temperature,
    score,
    status: verdict.reject ? ("unqualified" as const) : ("new" as const),
    source_type: input.sourceType as LeadSourceType,
    source_detail: input.sourceDetail ?? null,
    property_id: input.propertyId ?? null,
    guide_id: input.guideId ?? null,
    utm_source: input.utmSource ?? null,
    utm_medium: input.utmMedium ?? null,
    utm_campaign: input.utmCampaign ?? null,
    utm_term: input.utmTerm ?? null,
    utm_content: input.utmContent ?? null,
    referrer_url: input.referrerUrl ?? null,
    landing_page_url: input.landingPageUrl ?? null,
    page_path: input.pagePath ?? null,
    fbclid: input.fbclid ?? null,
    gclid: input.gclid ?? null,
    fbc: input.fbc ?? null,
    fbp: input.fbp ?? null,
    gbraid: input.gbraid ?? null,
    wbraid: input.wbraid ?? null,
    msclkid: input.msclkid ?? null,
    ttclid: input.ttclid ?? null,
    first_utm_source: input.firstUtmSource ?? null,
    first_utm_medium: input.firstUtmMedium ?? null,
    first_utm_campaign: input.firstUtmCampaign ?? null,
    first_landing_page_url: input.firstLandingPageUrl ?? null,
    first_seen_at: input.firstSeenAt ?? null,
    dedupe_key: dedupeKey,
    spam_score: verdict.score,
    spam_reasons: verdict.reasons,
    /* A rejected submission is parked as unqualified rather than queued for a
     * consultant: visible in the inbox, filtered out of the working list. */
    marketing_consent: input.marketingConsent ?? false,
    consent_at: input.marketingConsent ? new Date().toISOString() : null,
    qualification_answers: {
      ...(input.qualificationAnswers ?? {}),
      /* Keep the reasoning next to the score so the inbox can explain it. */
      score_reasons: reasons,
    },
    raw_payload: input as unknown as JsonObject,
  };

  /* Typed against the hand-declared Phase 6 shape, because the generated types
   * do not yet carry the attribution and outcome columns. */
  const { data, error } = await (supabaseAdmin as unknown as SupabaseClient<PaidMediaDatabase>)
    .from("leads")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(`Could not save the enquiry: ${error.message}`);

  /*
   * Junk gets neither the emails nor the conversion. Reporting it to an ad
   * platform is the expensive mistake: the platform learns to find more of it,
   * and the account optimises itself towards the traffic we least want.
   */
  if (verdict.reject) {
    console.warn(
      `[leads] ${data.id} flagged as spam (${verdict.score}): ${verdict.reasons.join("; ")}`,
    );
    return { ok: true, leadId: data.id, temperature };
  }

  /*
   * Route before the emails, so the notification names the consultant who owns
   * it rather than going to a general inbox for someone to hand out later.
   * Speed to reply is the number that decides whether paid traffic converts.
   */
  const { routeLead } = await import("./routing.server");
  await routeLead({ leadId: data.id, temperature, score });

  await dispatchLeadEmails(data.id).catch((emailError: unknown) => {
    console.error("[leads] email dispatch failed", emailError);
  });

  /*
   * Tell the ad platforms, with the event id the browser pixel used. Failure
   * here costs measurement, never the enquiry, a lead that saved but could not
   * be reported is a bookkeeping problem; a lead lost because a pixel was down
   * is a client who never hears back.
   */
  await dispatchLeadConversion(data.id, input, score).catch((conversionError: unknown) => {
    console.error("[leads] conversion dispatch failed", conversionError);
  });

  /* A report request earns its report there and then. */
  if (input.sourceType === "market_report") {
    try {
      const { createReportGrant } = await import("./reports.server");
      /* "area-report-palm-jumeirah" → "palm-jumeirah"; the market report has no area. */
      const areaSlug = input.sourceDetail?.startsWith("area-report-")
        ? input.sourceDetail.slice("area-report-".length)
        : null;
      const grant = await createReportGrant(data.id, areaSlug);
      return { ok: true, leadId: data.id, temperature, reportToken: grant.token };
    } catch (grantError) {
      /* The enquiry is saved either way; a failed grant is not worth losing it. */
      console.error("[leads] could not issue report grant", grantError);
    }
  }

  return { ok: true, leadId: data.id, temperature };
}

/**
 * Asks the Edge Function to send the admin notification and the client
 * confirmation. Kept as a separate function so the admin inbox can re-send.
 */
export async function dispatchLeadEmails(leadId: string): Promise<void> {
  const supabaseAdmin = await adminDb();

  const { error } = await supabaseAdmin.functions.invoke("send-lead-emails", {
    body: { leadId },
  });

  if (error) throw error;
}

/**
 * Reports a new lead as a conversion.
 *
 * The value sent is the *budget*, not a deal value, nothing has been earned
 * yet. Sending a plausible-looking revenue figure at enquiry time is how a
 * platform learns to optimise for people who claim large budgets, which is a
 * different population from people who buy.
 */
async function dispatchLeadConversion(
  leadId: string,
  input: LeadSubmission,
  score: number,
): Promise<void> {
  const { dispatchConversion } = await import("./conversions.server");

  await dispatchConversion({
    leadId,
    event: input.sourceType === "market_report" ? "request_report" : "submit_lead",
    /* No browser id means this came from somewhere without one, a webhook, a
     * phone call. A fresh id is still needed so the platform can deduplicate a
     * retry of this same dispatch. */
    eventId: input.eventId ?? crypto.randomUUID(),
    ...(input.budgetMin !== undefined ? { valueAed: input.budgetMin } : {}),
    user: {
      email: input.email ?? null,
      phone: input.phone ?? null,
      firstName: input.fullName?.split(" ")[0] ?? null,
      lastName: input.fullName?.split(" ").slice(1).join(" ") || null,
      countryCode: input.countryCode ?? null,
      fbc: input.fbc ?? null,
      fbp: input.fbp ?? null,
      gclid: input.gclid ?? null,
      gbraid: input.gbraid ?? null,
      wbraid: input.wbraid ?? null,
    },
    sourceUrl: input.landingPageUrl ?? null,
  });

  /* The score is not sent here. It is what decides whether this lead later
   * earns a `qualified_lead` conversion, which is the signal actually worth
   * optimising towards. See `reportLeadOutcome`. */
  void score;
}
