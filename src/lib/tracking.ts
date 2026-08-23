/**
 * The tracker.
 *
 * Everything that reaches an ad platform from the browser goes through
 * `track()`. Three rules make that worth doing.
 *
 * NOTHING LOADS BEFORE CONSENT. The Meta and Google scripts are not in the
 * document until someone has said yes, so a visitor who declines is not merely
 * untracked — they never contacted those servers at all. A consent banner that
 * hides an already-loaded pixel is theatre, and several of this site's
 * audiences are covered by regimes that treat it as such.
 *
 * EVENTS ARE QUEUED, NOT DROPPED. Someone who converts and *then* accepts
 * should still be counted, so events fired before consent wait in memory and
 * replay once the scripts are up. Events fired under a refusal are discarded.
 *
 * EVERY CONVERSION CARRIES AN EVENT ID. The same id goes to the browser pixel
 * and to the server's Conversions API call, which is the only thing that stops
 * one lead being counted twice.
 */
import {
  CONSENT_STORAGE_KEY,
  DENIED,
  EVENTS,
  adsConfigured,
  adsLabelFor,
  anyTagConfigured,
  ga4Configured,
  metaConfigured,
  tags,
  type ConsentState,
  type TrackedEvent,
} from "@/config/tracking";

/* The globals the vendor scripts install. */
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = {
  /** Deduplication id, shared with the server-side dispatch. */
  eventId?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  /** Anything else worth sending. Kept flat: nested objects travel badly. */
  [key: string]: string | number | boolean | string[] | undefined;
};

let consent: ConsentState = DENIED;
let loaded = false;
const queue: Array<{ event: TrackedEvent; params: EventParams }> = [];

/* ------------------------------------------------------------- consent --- */

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return DENIED;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return DENIED;
    const parsed = JSON.parse(stored) as Partial<ConsentState>;
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      ...(parsed.decidedAt ? { decidedAt: parsed.decidedAt } : {}),
    };
  } catch {
    return DENIED;
  }
}

/** True once the visitor has answered, either way. */
export function hasDecided(): boolean {
  return Boolean(readConsent().decidedAt);
}

/**
 * Records a decision and acts on it immediately.
 *
 * Accepting loads the scripts and flushes anything queued. Declining does not
 * unload what is already there — it cannot — but it stops everything after,
 * and since nothing loads before acceptance there is normally nothing to undo.
 */
export function setConsent(next: { analytics: boolean; marketing: boolean }): void {
  consent = { ...next, decidedAt: new Date().toISOString() };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* Storage blocked: the choice holds for this page load and is asked again. */
  }

  /* Google's own consent signal, for the tags that read it. */
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: next.analytics ? "granted" : "denied",
      ad_storage: next.marketing ? "granted" : "denied",
      ad_user_data: next.marketing ? "granted" : "denied",
      ad_personalization: next.marketing ? "granted" : "denied",
    });
  }

  if (next.analytics || next.marketing) {
    loadTags();
    flush();
  } else {
    queue.length = 0;
  }
}

/** Restores a previous decision on boot. */
export function initTracking(): void {
  if (typeof window === "undefined" || !anyTagConfigured()) return;

  consent = readConsent();
  if (consent.analytics || consent.marketing) {
    loadTags();
    flush();
  }
}

/* --------------------------------------------------------------- tags ---- */

function injectScript(src: string, onLoad?: () => void): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  if (onLoad) script.onload = onLoad;
  document.head.appendChild(script);
}

function loadTags(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  if (consent.marketing && metaConfigured()) loadMetaPixel();
  if ((consent.analytics && ga4Configured()) || (consent.marketing && adsConfigured())) {
    loadGoogle();
  }
}

function loadMetaPixel(): void {
  /* The vendor snippet, written out rather than pasted as an opaque blob: a
   * stub that queues calls until the real library replaces it. */
  const stub = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = stub as any;
    if (self.callMethod) self.callMethod(...args);
    else (self.queue ??= []).push(args);
  } as Window["fbq"] & { callMethod?: (...args: unknown[]) => void };

  if (!window.fbq) {
    window.fbq = stub as NonNullable<Window["fbq"]>;
    window._fbq = stub;
    stub.queue = [];
    injectScript("https://connect.facebook.net/en_US/fbevents.js");
  }

  window.fbq?.("init", tags.metaPixelId);
  window.fbq?.("track", "PageView");
}

function loadGoogle(): void {
  window.dataLayer ??= [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  /* Consent mode is set before the tag loads, so the first hit already carries
   * the visitor's answer rather than a default. */
  window.gtag("consent", "default", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });

  const primaryId = ga4Configured() ? tags.ga4MeasurementId : tags.googleAdsId;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${primaryId}`);

  window.gtag("js", new Date());
  if (consent.analytics && ga4Configured()) window.gtag("config", tags.ga4MeasurementId);
  if (consent.marketing && adsConfigured()) window.gtag("config", tags.googleAdsId);
}

/* -------------------------------------------------------------- events --- */

/**
 * A deduplication id.
 *
 * Shared between the browser pixel and the server's Conversions API call for
 * the same conversion. Without it Meta counts both and the campaign looks twice
 * as good as it is — which is worse than not measuring at all, because someone
 * will spend money on the strength of it.
 */
export function newEventId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function track(event: TrackedEvent, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  if (!consent.analytics && !consent.marketing) {
    /* Not lost: replayed if they accept, discarded if they refuse. */
    if (!hasDecided()) queue.push({ event, params });
    return;
  }

  send(event, params);
}

function flush(): void {
  const pending = queue.splice(0, queue.length);
  for (const entry of pending) send(entry.event, entry.params);
}

function send(event: TrackedEvent, params: EventParams): void {
  const mapping = EVENTS[event];

  if (consent.marketing && metaConfigured() && window.fbq) {
    const payload: Record<string, unknown> = {};
    if (params.value !== undefined) payload["value"] = params.value;
    if (params.currency) payload["currency"] = params.currency;
    if (params.contentName) payload["content_name"] = params.contentName;
    if (params.contentIds) payload["content_ids"] = params.contentIds;

    window.fbq(
      "track",
      mapping.meta,
      payload,
      params.eventId ? { eventID: params.eventId } : undefined,
    );
  }

  if (consent.analytics && ga4Configured() && window.gtag) {
    window.gtag("event", mapping.ga4, stripUndefined(params));
  }

  if (consent.marketing && window.gtag) {
    const sendTo = adsLabelFor(event);
    if (sendTo) {
      window.gtag("event", "conversion", {
        send_to: sendTo,
        ...(params.value !== undefined ? { value: params.value } : {}),
        currency: params.currency ?? "AED",
        ...(params.eventId ? { transaction_id: params.eventId } : {}),
      });
    }
  }
}

function stripUndefined(params: EventParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** A page view, for the client-side navigations a SPA does not report. */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (consent.marketing && metaConfigured() && window.fbq) window.fbq("track", "PageView");
  if (consent.analytics && ga4Configured() && window.gtag) {
    window.gtag("event", "page_view", { page_path: path });
  }
}
