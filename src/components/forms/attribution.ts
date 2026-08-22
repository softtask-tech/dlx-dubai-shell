/**
 * Marketing attribution captured from the browser.
 *
 * UTM tags and click ids arrive on the landing URL and are usually gone by the
 * time someone fills in a form three pages later, so they are stashed in
 * sessionStorage on first sight and read back at submission. Session scope, not
 * local: attribution belongs to this visit.
 */

const STORAGE_KEY = "dlx.attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  referrerUrl?: string;
  landingPageUrl?: string;
};

const PARAM_MAP: ReadonlyArray<[param: string, key: keyof Attribution]> = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_term", "utmTerm"],
  ["utm_content", "utmContent"],
  ["fbclid", "fbclid"],
  ["gclid", "gclid"],
];

/**
 * Records attribution for this visit, if it has not been recorded already.
 * First touch wins — the campaign that brought someone to the site is the one
 * that earned the lead, not whichever page they happened to convert on.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const captured: Attribution = { landingPageUrl: window.location.href };
    if (document.referrer) captured.referrerUrl = document.referrer;

    for (const [param, key] of PARAM_MAP) {
      const value = params.get(param);
      if (value) captured[key] = value;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  } catch {
    /* Private mode or blocked storage: attribution is nice to have, not required. */
  }
}

/** Reads back what was captured. Returns an empty object when unavailable. */
export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}
