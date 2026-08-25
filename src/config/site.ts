/**
 * DLX Properties, the one import for "everything about DLX".
 *
 * Brand facts live in `brand.ts` and the page registry in `pages.ts`; both are
 * import-free so build scripts can read them. This file adds the parts that
 * depend on the deployment (the canonical origin) and re-exports the rest, so
 * a component only ever needs `@/config/site`.
 */

/* Brand facts and the page registry live next door; re-exported so callers
 * have a single import for "everything about DLX". */
import { brand } from "./brand";

export { brand as site } from "./brand";
export { SITE_PAGES, pageFor, ogImagePathFor } from "./pages";
export type { SitePage, ChangeFrequency } from "./pages";

/**
 * Canonical origin, used for absolute URLs in meta tags, JSON-LD and the
 * sitemap. Set `VITE_SITE_URL` per environment (no trailing slash).
 */
export const SITE_URL = (import.meta.env["VITE_SITE_URL"] ?? `https://${brand.domain}`).replace(
  /\/+$/,
  "",
);

/** Resolves a path or absolute URL to an absolute URL on the canonical origin. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
