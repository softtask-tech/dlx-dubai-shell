/**
 * Which webfonts a page loads, decided by the language it is in.
 *
 * Every face is served from our own origin. There is no `<link>` to Google
 * Fonts and no preconnect to a font CDN: a third-party stylesheet on the
 * critical path is a render-blocking request to a host we do not control, and
 * it is the request that decides when the headline paints. The files live in
 * `public/fonts` and are fetched by `scripts/fetch-fonts.mjs`.
 *
 * The Latin pair (Playfair Display and Geist) is compiled into the site
 * stylesheet, so it costs no extra request on any page. What this module adds
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
 * The two files every page starts painting with: the Latin subset of the
 * display serif and of the body grotesk.
 *
 * Deliberately only two. A preload is a promise that the file is needed
 * immediately, and preloading a face the page may never set text in (the
 * Cyrillic subset, the italic) spends bandwidth the headline wanted.
 */
const PRELOAD = [
  "/fonts/playfair-display-latin-400-700-normal.woff2",
  "/fonts/geist-latin-300-600-normal.woff2",
] as const;

/**
 * The extra stylesheet each language needs on top of the Latin pair.
 *
 * `zh` is deliberately absent: a Simplified Chinese webfont is several
 * megabytes and the system stack in styles.css is what the reader's own
 * platform already renders Chinese in. `ru` is absent too, but for the opposite
 * reason: Playfair Display and Geist both ship Cyrillic, so a Russian page is
 * set in the house pair and downloads a different subset of the same files.
 */
const PER_LOCALE: Partial<Record<LocaleCode, string>> = {
  ar: "/fonts/arabic.css",
  hi: "/fonts/devanagari.css",
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
