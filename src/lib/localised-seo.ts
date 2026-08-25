/**
 * The head for a translated page.
 *
 * Title, description and social line come from that language's dictionary, so
 * an Arabic page has an Arabic `<title>` and an Arabic search snippet rather
 * than an English one over Arabic body copy, which is what most "multilingual"
 * sites actually ship, and the reason they rank in one language.
 *
 * The social card is generated per language too. It sets the page's tagline at
 * 82 points, so an Arabic page sharing the English card would preview on
 * WhatsApp, which is how a Gulf buyer sends a property to their family, as an
 * English sentence over an Arabic page. `npm run og` renders all twenty, each
 * in its own script and direction.
 */
import { isLocaleCode, ogImagePathForLocale, type LocaleCode } from "@/config/locales";
import { ogImagePathFor } from "@/config/site";
import { dictionaryFor } from "@/i18n";
import { pageHead } from "./seo";

/** Paths that carry a dictionary entry. Keyed to `LOCALISED_PATHS`. */
type LocalisedPath = "/" | "/about" | "/services" | "/tools" | "/contact";

/**
 * Builds the head for `path` in `lang`.
 *
 * The route passes the raw path param, which the layout has already refused to
 * render for an unknown language, but this runs in `head()`, which the router
 * may call before `beforeLoad` throws, so it falls back rather than trusting it.
 */
export function localisedHead(lang: string, path: LocalisedPath) {
  const code: LocaleCode = isLocaleCode(lang) ? lang : "en";
  const meta = dictionaryFor(code).meta[path];

  return pageHead({
    path,
    locale: code,
    title: meta.title,
    description: meta.description,
    tagline: meta.tagline,
    image: ogImagePathForLocale(path, code, ogImagePathFor(path)),
    /* The dictionary titles are written whole, in their own language. Appending
     * ", DLX Properties" to a Chinese title would add an em-dash convention
     * that language does not use. */
    fullTitle: true,
    ...(path === "/" ? {} : { breadcrumbs: [{ name: meta.title, path }] }),
  });
}
