/**
 * Which webfonts a page loads, decided by the language it is in.
 *
 * Every face is served from our own origin. There is no `<link>` to Google
 * Fonts and no preconnect to a font CDN: a third-party stylesheet on the
 * critical path is a render-blocking request to a host we do not control, and
 * it is the request that decides when the headline paints. The files live in
 * `public/fonts` and are fetched by `scripts/fetch-fonts.mjs`.
 *
 * The Latin faces (Instrument Sans and EB Garamond) are compiled into the site
 * stylesheet, so they cost no extra request on any page. What this module adds
 * is two things:
 *
 *   1. A preload for the two woff2 files an English page is certain to use, so
 *      they start downloading alongside the stylesheet rather than after the
 *      browser has parsed it and discovered the @font-face.
 *   2. The extra stylesheet a non-Latin script needs, on the pages written in
 *      that script and nowhere else. Nobody pays for a script they cannot read,
 *      which on a Core Web Vitals budget is the difference between a fast site
 *      and a fast English site.
 */
import type { LinkHTMLAttributes } from "react";

import type { LocaleCode } from "@/config/locales";

/**
 * The one file every page starts painting with: the Latin subset of the
 * workhorse sans.
 *
 * Deliberately one. A preload is a promise that the file is needed
 * immediately, and preloading a face the page may never set text in (the
 * Cyrillic subset, the italic, the serif accent) spends bandwidth the headline
 * wanted.
 */
const PRELOAD = [
  /* Only the workhorse. The serif accent appears once or twice per page,
   * always below or beside the first line rather than as it, so preloading it
   * would compete with the face the whole page is actually set in. */
  "/fonts/instrument-sans-latin-400-600-normal.woff2",
] as const;

/**
 * The extra stylesheet each language needs on top of the Latin pair.
 *
 * `zh` is deliberately absent: a Simplified Chinese webfont is several
 * megabytes and the system stack in styles.css is what the reader's own
 * platform already renders Chinese in.
 */
const PER_LOCALE: Partial<Record<LocaleCode, string>> = {
  ar: "/fonts/arabic.css",
  hi: "/fonts/devanagari.css",
  /* Only the workhorse: EB Garamond's Cyrillic is already in the site
   * stylesheet, so the serif accent needs nothing extra here. */
  ru: "/fonts/cyrillic.css",
};

/** The preloads plus any script stylesheet. Emitted once, by the root route. */
export function fontLinks(code: LocaleCode): LinkHTMLAttributes<HTMLLinkElement>[] {
  return [
    ...PRELOAD.map((href) => ({
      rel: "preload",
      as: "font",
      type: "font/woff2",
      href,
      /* Fonts are fetched in CORS mode even from the same origin, so a preload
       * without this is a second, separate download rather than a hit. */
      crossOrigin: "anonymous" as const,
    })),
    ...scriptFontLinks(code),
  ];
}

/**
 * The extra face for a non-Latin script, if this language needs one.
 *
 * Emitted by the `$lang` layout rather than the root, which is what confines
 * the download to the pages actually written in that script.
 */
export function scriptFontLinks(code: LocaleCode): LinkHTMLAttributes<HTMLLinkElement>[] {
  const href = PER_LOCALE[code];
  return href ? [{ rel: "stylesheet", href }] : [];
}
