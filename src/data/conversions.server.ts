/**
 * Sending conversions back to the ad platforms.
 *
 * The browser pixel is the unreliable half of measurement: ad blockers, ITP,
 * a tab closed before the event flushes. The server has the lead in hand and
 * can say so directly — which is the point of the Conversions API — but it
 * brings two problems of its own, and both are handled here rather than left
 * to whoever reads the dashboard.
 *
 * DOUBLE COUNTING. The browser already reported this conversion. Every dispatch
 * carries the same `event_id` the pixel used, which is how Meta collapses the
 * pair into one. A conversion counted twice is worse than one counted never:
 * someone will raise a budget on the strength of it.
 *
 * SILENT FAILURE. Server-side tracking fails invisibly — nothing breaks, the
 * site looks fine, and a month later the numbers are simply missing. Every
 * attempt is written to `conversion_events` with its status and whatever the
 * platform said, so "when did this stop working" has an answer.
 *
 * Identifiers are hashed before they leave. Meta requires SHA-256 of the
 * normalised value, and it also means this codebase never posts a client's
 * email address to a third party in the clear.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { adminDb } from "./database.server";
import { EVENTS, type TrackedEvent } from "@/config/tracking";
import type { PaidMediaDatabase } from "./paid-media-types";

const META_API_VERSION = "v21.0";

export type ConversionInput = {
  leadId: string;
  event: TrackedEvent;
  /** Shared with the browser pixel. Generated here when there was no browser. */
  eventId: string;
  valueAed?: number;
  /** When the conversion happened. Platforms reject events far in the past. */
  occurredAt?: Date;
  user: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    countryCode?: string | null;
    /** Meta's click and browser ids, captured at attribution time. */
    fbc?: string | null;
    fbp?: string | null;
    /** Google's click ids. */
    gclid?: string | null;
    gbraid?: string | null;
    wbraid?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  /** The page they converted on, for Meta's event source url. */
  sourceUrl?: string | null;
};

async function paidDb(): Promise<SupabaseClient<PaidMediaDatabase>> {
  return (await adminDb()) as unknown as SupabaseClient<PaidMediaDatabase>;
}

/** SHA-256 hex of a normalised value, as every platform's matching expects. */
async function hashed(value: string | null | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (normalised.length === 0) return undefined;

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalised));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** E.164 without the plus, which is what Meta hashes. */
function normalisePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 7 ? digits : undefined;
}

/**
 * Records the intent to send, then sends.
 *
 * Written first, dispatched second, updated third — so a crash mid-flight
 * leaves a `pending` row that can be retried rather than a conversion nobody
 * knows was lost.
 */
export async function dispatchConversion(input: ConversionInput): Promise<void> {
  const destinations: Array<"meta_capi" | "google_ads"> = [];
  if (process.env["META_CAPI_TOKEN"] && process.env["META_PIXEL_ID"])
    destinations.push("meta_capi");
  if (process.env["GOOGLE_ADS_CONVERSION_URL"]) destinations.push("google_ads");

  if (destinations.length === 0) return;

  const supabase = await paidDb();

  for (const destination of destinations) {
    const { data: row, error } = await supabase
      .from("conversion_events")
      .insert({
        lead_id: input.leadId,
        destination,
        event_name: EVENTS[input.event].meta,
        event_id: input.eventId,
        value_aed: input.valueAed ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      /* A unique violation means this exact conversion was already recorded —
       * a retry, or a webhook delivered twice. Nothing to do, and certainly
       * nothing to send. */
      if (!error.message.includes("duplicate key")) {
        console.error(`[conversions] could not record the ${destination} dispatch`, error);
      }
      continue;
    }

    try {
      const response =
        destination === "meta_capi" ? await sendToMeta(input) : await sendToGoogleAds(input);

      await supabase
        .from("conversion_events")
        .update({
          status: response.ok ? "sent" : "failed",
          attempts: 1,
          response: response.body as never,
          error: response.ok ? null : (response.error ?? "rejected"),
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (!response.ok) {
        console.error(`[conversions] ${destination} rejected the event`, response.error);
      }
    } catch (dispatchError) {
      const message = dispatchError instanceof Error ? dispatchError.message : "unknown";
      await supabase
        .from("conversion_events")
        .update({ status: "failed", attempts: 1, error: message })
        .eq("id", row.id);
      console.error(`[conversions] ${destination} dispatch threw`, dispatchError);
    }
  }
}

type DispatchResult = { ok: boolean; body?: unknown; error?: string };

async function sendToMeta(input: ConversionInput): Promise<DispatchResult> {
  const pixelId = process.env["META_PIXEL_ID"];
  const token = process.env["META_CAPI_TOKEN"];
  if (!pixelId || !token) return { ok: false, error: "Meta is not configured" };

  const [email, phone, firstName, lastName] = await Promise.all([
    hashed(input.user.email),
    hashed(normalisePhone(input.user.phone)),
    hashed(input.user.firstName),
    hashed(input.user.lastName),
  ]);

  const userData: Record<string, unknown> = {};
  if (email) userData["em"] = [email];
  if (phone) userData["ph"] = [phone];
  if (firstName) userData["fn"] = [firstName];
  if (lastName) userData["ln"] = [lastName];
  /* Click and browser ids are not hashed — they are already opaque, and Meta
   * matches on them directly. They are also what makes matching actually work
   * when someone gave only a first name. */
  if (input.user.fbc) userData["fbc"] = input.user.fbc;
  if (input.user.fbp) userData["fbp"] = input.user.fbp;
  if (input.user.ipAddress) userData["client_ip_address"] = input.user.ipAddress;
  if (input.user.userAgent) userData["client_user_agent"] = input.user.userAgent;

  const body = {
    data: [
      {
        event_name: EVENTS[input.event].meta,
        event_time: Math.floor((input.occurredAt ?? new Date()).getTime() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.sourceUrl ? { event_source_url: input.sourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: "AED",
          ...(input.valueAed !== undefined ? { value: input.valueAed } : {}),
        },
      },
    ],
    ...(process.env["META_TEST_EVENT_CODE"]
      ? { test_event_code: process.env["META_TEST_EVENT_CODE"] }
      : {}),
  };

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  return response.ok
    ? { ok: true, body: payload }
    : { ok: false, body: payload, error: `Meta responded ${response.status}` };
}

/**
 * Google Ads offline conversions.
 *
 * Posted to a configurable endpoint rather than built against the Google Ads
 * API directly. That API needs OAuth, a developer token and a customer id, and
 * wiring it here would put a second credential dance in a codebase that has no
 * other use for one. A thin relay — a Cloud Function, a Zap, an Apps Script —
 * is the shape most brokerages actually deploy, and swapping it for the real
 * API later is a change behind this one function.
 */
async function sendToGoogleAds(input: ConversionInput): Promise<DispatchResult> {
  const endpoint = process.env["GOOGLE_ADS_CONVERSION_URL"];
  if (!endpoint) return { ok: false, error: "Google Ads is not configured" };

  const clickId = input.user.gclid ?? input.user.gbraid ?? input.user.wbraid;
  if (!clickId) {
    /* No click id, no attribution. Reporting it as sent would be a lie. */
    return { ok: false, error: "No Google click id on this lead" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env["GOOGLE_ADS_CONVERSION_SECRET"]
        ? { "x-conversion-secret": process.env["GOOGLE_ADS_CONVERSION_SECRET"] }
        : {}),
    },
    body: JSON.stringify({
      conversionAction: EVENTS[input.event].adsLabelKey ?? input.event,
      gclid: input.user.gclid ?? null,
      gbraid: input.user.gbraid ?? null,
      wbraid: input.user.wbraid ?? null,
      conversionDateTime: (input.occurredAt ?? new Date()).toISOString(),
      conversionValue: input.valueAed ?? null,
      currencyCode: "AED",
      orderId: input.eventId,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const payload: unknown = await response.json().catch(() => null);
  return response.ok
    ? { ok: true, body: payload }
    : { ok: false, body: payload, error: `Google Ads relay responded ${response.status}` };
}

/* ------------------------------------------------- offline conversions --- */

/**
 * Reports what became of a lead.
 *
 * This is the half of measurement that actually changes what the platforms buy.
 * A `Lead` event teaches them to find people who fill in forms; a
 * `qualified_lead` and a `deal_won` — with the click id and the real value —
 * teaches them to find people who buy. Without it, an ad account optimises
 * itself very efficiently towards worthless traffic, and the reporting looks
 * excellent the whole way down.
 *
 * Called when a consultant moves a lead in the admin, so the signal comes from
 * a human judgement rather than from a rule guessing at one.
 */
export async function reportLeadOutcome(
  leadId: string,
  outcome: "qualified" | "won",
): Promise<{ sent: boolean; reason?: string }> {
  const supabase = await paidDb();

  const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (error || !data) return { sent: false, reason: error?.message ?? "Lead not found" };

  const lead = data as Record<string, unknown>;
  const str = (key: string): string | null => {
    const value = lead[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  const dealValue = typeof lead["deal_value_aed"] === "number" ? lead["deal_value_aed"] : undefined;

  /* A won deal with no recorded value is reported without one rather than with
   * a guess. An invented revenue figure trains the platform on fiction. */
  if (outcome === "won" && dealValue === undefined) {
    console.warn(`[conversions] lead ${leadId} won with no deal value; reporting without one`);
  }

  const fullName = str("full_name");

  await dispatchConversion({
    leadId,
    event: outcome === "won" ? "deal_won" : "qualified_lead",
    /* Deterministic, so re-marking a lead cannot report the same outcome twice:
     * the unique index on (destination, event_id) refuses the duplicate. */
    eventId: `${outcome}:${leadId}`,
    ...(dealValue !== undefined ? { valueAed: dealValue } : {}),
    user: {
      email: str("email"),
      phone: str("phone"),
      firstName: fullName?.split(" ")[0] ?? null,
      lastName: fullName?.split(" ").slice(1).join(" ") || null,
      countryCode: str("country_code"),
      fbc: str("fbc"),
      fbp: str("fbp"),
      gclid: str("gclid"),
      gbraid: str("gbraid"),
      wbraid: str("wbraid"),
    },
    sourceUrl: str("landing_page_url"),
  });

  return { sent: true };
}
