/**
 * Where the visitor is, roughly, and what that means for the price they see.
 *
 * Read from the edge's own geo header rather than an IP lookup service. The CDN
 * already resolved this before the request reached us: asking a third party to
 * do it again would cost a round trip on every page load, put every visitor's
 * IP address in someone else's logs, and produce a worse answer.
 *
 * It is used for exactly one thing — choosing which currency to open with. It
 * never changes the language (the URL decides that, so a shared link means the
 * same page for everyone), never gates content, and is overridden the moment
 * the visitor touches the picker. A country guess is a courtesy; a country
 * guess that cannot be overridden is a cage.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { currencyForCountry, type CurrencyCode } from "./currency";

export type GeoHint = {
  /** ISO 3166-1 alpha-2, or null when the edge did not say. */
  country: string | null;
  currency: CurrencyCode;
};

/**
 * The headers the major edges set, in the order we trust them.
 *
 * Cloudflare first because that is what this site deploys behind; the rest are
 * here so a move to another host is a deployment change rather than a code
 * change. `x-dlx-country` is last and exists for local testing — set it in a
 * request and you can see exactly what a visitor from Karachi sees.
 */
const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-nf-geo-country",
  "fastly-client-country-code",
  "x-appengine-country",
  "x-dlx-country",
] as const;

function countryFromHeaders(headers: Record<string, string | undefined>): string | null {
  for (const name of COUNTRY_HEADERS) {
    const value = headers[name];
    /* Cloudflare sends XX for anonymised clients and T1 for Tor. Both mean "we
     * do not know", and treating them as countries would price a Tor user in
     * Trinidadian dollars. */
    if (value && /^[A-Za-z]{2}$/.test(value) && !["XX", "T1"].includes(value.toUpperCase())) {
      return value.toUpperCase();
    }
  }
  return null;
}

export const getGeoHintFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeoHint> => {
    try {
      const headers = getRequestHeaders() as unknown as Record<string, string | undefined>;
      const country = countryFromHeaders(headers);
      return { country, currency: currencyForCountry(country) };
    } catch {
      /* No request context — a prerender, a test. AED is the honest default: it
       * is what the property is actually priced in. */
      return { country: null, currency: "AED" };
    }
  },
);
