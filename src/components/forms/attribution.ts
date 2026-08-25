/**
 * Marketing attribution captured from the browser.
 *
 * UTM tags and click ids arrive on the landing URL and are usually gone by the
 * time someone fills in a form three pages later, so they are stashed on first
 * sight and read back at submission.
 *
 * TWO TOUCHES, TWO SCOPES. Last touch lives in `sessionStorage`, it belongs to
 * this visit, and the campaign someone clicked this morning should not be
 * credited with the enquiry they send next week. First touch lives in
 * `localStorage`, because the campaign that *introduced* someone is a different
 * question and a genuinely useful one: on a purchase this size the first click
 * and the converting click are often months and several campaigns apart.
 *
 * CLICK IDS MATTER MORE THAN THEY LOOK. Meta matches far better on `fbc` and
 * `fbp` together than on hashed contact details alone, and on iOS Google
 * replaces `gclid` with `gbraid`/`wbraid` entirely. Collected here because they
 * are worthless if collected late, they exist only on the landing URL.
 *
 * None of this leaves the browser on its own. It travels attached to an enquiry
 * the visitor chose to send, which is also why it is captured regardless of
 * cookie consent: it is not a tracker, it is a field on a form they are filling
 * in.
 */

const STORAGE_KEY = "dlx.attribution";
const FIRST_TOUCH_KEY = "dlx.attribution.first";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  /** Meta's click id in the cookie format their API expects. */
  fbc?: string;
  /** Meta's browser id, set by the pixel itself. */
  fbp?: string;
  gbraid?: string;
  wbraid?: string;
  msclkid?: string;
  ttclid?: string;
  referrerUrl?: string;
  landingPageUrl?: string;

  /* First touch, carried separately so both can be reported. */
  firstUtmSource?: string;
  firstUtmMedium?: string;
  firstUtmCampaign?: string;
  firstLandingPageUrl?: string;
  firstSeenAt?: string;
};

const PARAM_MAP: ReadonlyArray<[param: string, key: keyof Attribution]> = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_term", "utmTerm"],
  ["utm_content", "utmContent"],
  ["fbclid", "fbclid"],
  ["gclid", "gclid"],
  ["gbraid", "gbraid"],
  ["wbraid", "wbraid"],
  ["msclkid", "msclkid"],
  ["ttclid", "ttclid"],
];

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Records attribution for this visit.
 *
 * Last touch is written once per session and first touch once per browser, so
 * a visitor who lands on a campaign link and then browses for twenty minutes
 * keeps the campaign rather than overwriting it with an internal referrer.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);

    if (!sessionStorage.getItem(STORAGE_KEY)) {
      const captured: Attribution = { landingPageUrl: window.location.href };
      if (document.referrer) captured.referrerUrl = document.referrer;

      for (const [param, key] of PARAM_MAP) {
        const value = params.get(param);
        if (value) captured[key] = value;
      }

      /* Meta's own format: version, subdomain index, click time, click id.
       * Constructed here because the pixel only sets the `_fbc` cookie once it
       * has loaded, which under a consent gate may be never. */
      const fbclid = params.get("fbclid");
      if (fbclid) captured.fbc = `fb.1.${Date.now()}.${fbclid}`;

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    }

    if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
      const first: Attribution = {
        firstLandingPageUrl: window.location.href,
        firstSeenAt: new Date().toISOString(),
      };
      const source = params.get("utm_source");
      const medium = params.get("utm_medium");
      const campaign = params.get("utm_campaign");
      if (source) first.firstUtmSource = source;
      if (medium) first.firstUtmMedium = medium;
      if (campaign) first.firstUtmCampaign = campaign;

      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(first));
    }
  } catch {
    /* Private mode or blocked storage: attribution is nice to have, not required. */
  }
}

/**
 * Reads back what was captured, both touches merged.
 *
 * `fbp` is read live rather than from storage: the pixel writes it after
 * consent, which is usually after the landing page was recorded.
 */
export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  try {
    const last = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Attribution;
    const first = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY) ?? "{}") as Attribution;

    const fbp = readCookie("_fbp");
    const fbc = last.fbc ?? readCookie("_fbc");

    return {
      ...first,
      ...last,
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    };
  } catch {
    return {};
  }
}
