/**
 * Lead submission — server side only.
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

import { adminDb } from "./database.server";
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

    /* Anything a specific form asked that has no column of its own. */
    qualificationAnswers: z.record(z.string(), z.unknown()).optional(),

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

  const { score, temperature, reasons } = scoreLead({
    intent: input.intent ?? null,
    timeline: input.timeline ?? null,
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    hasPhone: Boolean(input.phone),
    hasEmail: Boolean(input.email),
    isFinancing: input.isFinancing ?? null,
    message: input.message ?? null,
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
    status: "new" as const,
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
    marketing_consent: input.marketingConsent ?? false,
    consent_at: input.marketingConsent ? new Date().toISOString() : null,
    qualification_answers: {
      ...(input.qualificationAnswers ?? {}),
      /* Keep the reasoning next to the score so the inbox can explain it. */
      score_reasons: reasons,
    },
    raw_payload: input as unknown as JsonObject,
  };

  const { data, error } = await supabaseAdmin.from("leads").insert(row).select("id").single();

  if (error) throw new Error(`Could not save the enquiry: ${error.message}`);

  await dispatchLeadEmails(data.id).catch((emailError: unknown) => {
    console.error("[leads] email dispatch failed", emailError);
  });

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
