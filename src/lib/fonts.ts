/**
 * Which webfonts a page loads, decided by the language it is in.
 *
 * The English site loads two families and nothing else — the same two it loaded
 * before any of this existed. A reader on the Arabic pages loads the Arabic
 * pair instead; a reader on the Chinese pages loads no extra font at all.
 * Nobody pays for a script they cannot read, which on a Core Web Vitals budget
 * is the difference between a fast site and a fast English site.
 *
 * The Latin pair is requested on every page regardless of language. Numbers,
 * the DLX monogram, the phone number and every English proper noun on a
 * translated page are set in it, and falling back for those is the detail that
 * gives a localised page away.
 */
import type { LinkHTMLAttributes } from "react";

import type { LocaleCode } from "@/config/locales";

const GOOGLE_FONTS = "https://fonts.googleapis.com/css2";

/** Cormorant Garamond + Jost. Latin, and Cormorant's Cyrillic for Russian. */
const LATIN =
  `${GOOGLE_FONTS}?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400` +
  `&family=Jost:wght@300;400;500&display=swap`;

/**
 * The extra family (or families) each language needs on top of the Latin pair.
 *
 * `display=swap` throughout: a headline that is invisible until a font arrives
 * is a headline that fails Largest Contentful Paint, and the fallback stacks in
 * styles.css are chosen so the swap is not violent.
 */
const PER_LOCALE: Partial<Record<LocaleCode, string>> = {
  ar: `${GOOGLE_FONTS}?family=Amiri:wght@400;700&family=Noto+Sans+Arabic:wght@300;400;500&display=swap`,
  hi: `${GOOGLE_FONTS}?family=Noto+Serif+Devanagari:wght@300;400;500&family=Noto+Sans+Devanagari:wght@300;400;500&display=swap`,
  ru: `${GOOGLE_FONTS}?family=Noto+Sans:wght@300;400;500&display=swap`,
  /* zh deliberately absent — see the note in styles.css. A Simplified Chinese
   * webfont is several megabytes and the system stack is what the reader's own
   * platform already renders Chinese in. */
};

/** The Latin pair plus the preconnects. Emitted once, by the root route. */
export function fontLinks(code: LocaleCode): LinkHTMLAttributes<HTMLLinkElement>[] {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: LATIN },
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
