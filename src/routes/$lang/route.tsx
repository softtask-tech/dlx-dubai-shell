import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from "@/config/locales";
import { scriptFontLinks } from "@/lib/fonts";

/**
 * The locale layout: everything under /ar, /hi, /ru, /zh.
 *
 * WHY A DYNAMIC SEGMENT RATHER THAN FOUR STATIC ONES. TanStack Router resolves
 * static segments before dynamic ones, so `/about` still reaches the English
 * route and only `/ar/about` falls through to this branch. That ordering is
 * what lets English keep the bare path, which matters, because moving the
 * English site to `/en/` after launch would break every link and every ranking
 * the site has.
 *
 * The param is validated rather than trusted. Without this, `/xx/about` would
 * render the English dictionary under a made-up language code, and a crawler
 * that found such a URL would index an unbounded number of duplicates of every
 * translated page. A 404 is the correct answer to a language we do not publish.
 */
export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    /* `/en/about` is a duplicate of `/about`, so it is not a page either, the
     * canonical English URL carries no prefix and there is only ever one of it. */
    if (!isLocaleCode(params.lang) || params.lang === DEFAULT_LOCALE) throw notFound();
  },
  /* The face this language is set in, requested only on this branch of the
   * tree. An English visitor never downloads an Arabic font, and an Arabic
   * visitor never downloads a Devanagari one. */
  head: ({ params }) => ({
    links: isLocaleCode(params.lang) ? scriptFontLinks(params.lang as LocaleCode) : [],
  }),
  component: () => <Outlet />,
});
