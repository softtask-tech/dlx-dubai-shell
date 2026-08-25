/**
 * The tracking vocabulary.
 *
 * One list of the things a visitor can do that we care about, and one mapping
 * from each to what every platform calls it. The alternative, each capture
 * point calling `fbq` and `gtag` with whatever string seemed right that day,
 * is how analytics estates end up with `Lead`, `lead`, `LeadSubmit` and
 * `submit_lead` all meaning the same thing and none of them counting properly.
 *
 * Because the vocabulary is a union, a capture point cannot fire an event that
 * was never defined; the compiler refuses it.
 *
 * Tag ids are public by nature (they ship in the page for anyone to read) so
 * they are `VITE_` variables. The API tokens that let a server *write*
 * conversions are not, and never appear in this file.
 */

export type TrackedEvent =
  /* Interest */
  | "view_listing"
  | "search_listings"
  | "view_area"
  | "use_calculator"
  /* Intent */
  | "start_form"
  | "complete_form_step"
  | "advisor_open"
  | "advisor_message"
  | "call_click"
  | "whatsapp_click"
  /* Conversion */
  | "submit_lead"
  | "request_report"
  | "advisor_lead"
  /* Outcome, server-side only, sent as offline conversions */
  | "qualified_lead"
  | "deal_won";

/** What each event is called on each platform. */
type EventMapping = {
  /** Meta's standard event, or a custom name. */
  meta: string;
  /** GA4 recommended event where one fits, otherwise a custom name. */
  ga4: string;
  /**
   * Google Ads conversion actions are configured per account, so the label
   * comes from an env var keyed by this name rather than being hard-coded.
   */
  adsLabelKey?: string;
  /** True for the events that represent a real conversion. */
  isConversion: boolean;
};

export const EVENTS: Record<TrackedEvent, EventMapping> = {
  view_listing: { meta: "ViewContent", ga4: "view_item", isConversion: false },
  search_listings: { meta: "Search", ga4: "search", isConversion: false },
  view_area: { meta: "ViewContent", ga4: "view_item_list", isConversion: false },
  use_calculator: { meta: "CustomizeProduct", ga4: "use_calculator", isConversion: false },

  start_form: { meta: "InitiateCheckout", ga4: "begin_checkout", isConversion: false },
  complete_form_step: { meta: "AddToWishlist", ga4: "form_step", isConversion: false },
  advisor_open: { meta: "Contact", ga4: "advisor_open", isConversion: false },
  advisor_message: { meta: "Contact", ga4: "advisor_message", isConversion: false },
  call_click: { meta: "Contact", ga4: "call_click", adsLabelKey: "CALL", isConversion: true },
  whatsapp_click: {
    meta: "Contact",
    ga4: "whatsapp_click",
    adsLabelKey: "WHATSAPP",
    isConversion: true,
  },

  submit_lead: { meta: "Lead", ga4: "generate_lead", adsLabelKey: "LEAD", isConversion: true },
  request_report: {
    meta: "CompleteRegistration",
    ga4: "generate_lead",
    adsLabelKey: "REPORT",
    isConversion: true,
  },
  advisor_lead: { meta: "Lead", ga4: "generate_lead", adsLabelKey: "LEAD", isConversion: true },

  qualified_lead: {
    meta: "SubmitApplication",
    ga4: "qualified_lead",
    adsLabelKey: "QUALIFIED",
    isConversion: true,
  },
  deal_won: { meta: "Purchase", ga4: "purchase", adsLabelKey: "WON", isConversion: true },
};

/**
 * Which tags are configured.
 *
 * Read at module load from build-time env. An unconfigured platform is simply
 * never loaded: no script, no requests, no console errors. So a deployment
 * without ad accounts behaves as though Phase 6 had not happened.
 */
export const tags = {
  metaPixelId: import.meta.env["VITE_META_PIXEL_ID"] ?? "",
  ga4MeasurementId: import.meta.env["VITE_GA4_MEASUREMENT_ID"] ?? "",
  googleAdsId: import.meta.env["VITE_GOOGLE_ADS_ID"] ?? "",
  /**
   * Conversion labels as `LEAD:AbC-D_efGh,CALL:XyZ…`. One variable rather than
   * six keeps the deployment configuration to something a person can paste.
   */
  googleAdsLabels: import.meta.env["VITE_GOOGLE_ADS_LABELS"] ?? "",
} as const;

export function metaConfigured(): boolean {
  return tags.metaPixelId.length > 0;
}

export function ga4Configured(): boolean {
  return tags.ga4MeasurementId.length > 0;
}

export function adsConfigured(): boolean {
  return tags.googleAdsId.length > 0;
}

export function anyTagConfigured(): boolean {
  return metaConfigured() || ga4Configured() || adsConfigured();
}

/** Resolves a Google Ads conversion label, or null when it is not configured. */
export function adsLabelFor(event: TrackedEvent): string | null {
  const key = EVENTS[event].adsLabelKey;
  if (!key || !adsConfigured()) return null;

  for (const pair of tags.googleAdsLabels.split(",")) {
    const [name, label] = pair.split(":").map((part: string) => part.trim());
    if (name === key && label) return `${tags.googleAdsId}/${label}`;
  }
  return null;
}

/**
 * The consent categories.
 *
 * Two, not ten. "Analytics" is our own measurement; "marketing" is what lets an
 * ad platform recognise someone later. A visitor who accepts one and not the
 * other gets exactly that, which is the whole reason to separate them.
 */
export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  /** When they chose. Absent means they have not been asked yet. */
  decidedAt?: string;
};

export const CONSENT_STORAGE_KEY = "dlx.consent";

export const DENIED: ConsentState = { analytics: false, marketing: false };
