/**
 * The languages the site is published in.
 *
 * Kept free of imports and `import.meta` so plain Node can load it: the sitemap
 * and the OG card generator both need to know which locales exist and which
 * pages actually have a translation.
 *
 * THE RULE THAT SHAPES THIS FILE: the site never claims a translation it does
 * not have. `hreflang` is a promise to a search engine that a reader who speaks
 * Arabic will land on Arabic; pointing it at an English page is worse than
 * having no alternate at all, because the reader bounces and the engine learns
 * the site lies. So `LOCALISED_PATHS` is the short, honest list, and everything
 * downstream (hreflang, the sitemap, the language switcher) reads from it.
 *
 * English is the default and carries no prefix: `/about`, not `/en/about`. The
 * others are path-prefixed (`/ar/about`), which is the only URL strategy that
 * gives each language its own indexable address.
 */

export type LocaleCode = "en" | "ar" | "hi" | "ru" | "zh";

export type Locale = {
  code: LocaleCode;
  /** The language's name in English, for the `lang` attribute of the switcher. */
  englishName: string;
  /** The language's name in itself. A switcher that says "Arabic" to someone
   * who reads Arabic is a switcher written for the people who built it. */
  endonym: string;
  dir: "ltr" | "rtl";
  /** BCP 47 tag for `<html lang>` and `hreflang`. */
  htmlLang: string;
  /** Open Graph locale, underscore-separated. */
  ogLocale: string;
  /** Locale passed to Intl for numbers and dates. */
  intlLocale: string;
};

export const LOCALES: readonly Locale[] = [
  {
    code: "en",
    englishName: "English",
    endonym: "English",
    dir: "ltr",
    htmlLang: "en",
    ogLocale: "en_AE",
    intlLocale: "en-AE",
  },
  {
    code: "ar",
    englishName: "Arabic",
    endonym: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    ogLocale: "ar_AE",
    intlLocale: "ar-AE",
  },
  {
    code: "hi",
    englishName: "Hindi",
    endonym: "हिन्दी",
    dir: "ltr",
    htmlLang: "hi",
    ogLocale: "hi_IN",
    intlLocale: "hi-IN",
  },
  {
    code: "ru",
    englishName: "Russian",
    endonym: "Русский",
    dir: "ltr",
    htmlLang: "ru",
    ogLocale: "ru_RU",
    intlLocale: "ru-RU",
  },
  {
    code: "zh",
    englishName: "Chinese",
    endonym: "中文",
    dir: "ltr",
    htmlLang: "zh-Hans",
    ogLocale: "zh_CN",
    intlLocale: "zh-Hans",
  },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

/** Every locale except the default, the ones that carry a path prefix. */
export const PREFIXED_LOCALES = LOCALES.filter((locale) => locale.code !== DEFAULT_LOCALE);

/**
 * The pages that exist in every language.
 *
 * Deliberately short. These five are the whole journey a non-English reader
 * needs: what this is, who we are, what we do, the numbers, and how to reach a
 * person. Translating them properly is worth more than translating everything
 * badly.
 *
 * The rest of the site (guides, the journal, listings, area profiles) stays
 * in English, and says so. Several of those pages carry visa thresholds, fee
 * schedules and tax statements; an unreviewed translation of a legal figure is
 * exactly the invented specific CLAUDE.md forbids. A reader who wants those in
 * their own language gets the advisor, which answers in all five and cites the
 * same sources.
 */
export const LOCALISED_PATHS: readonly string[] = [
  "/",
  "/about",
  "/services",
  "/tools",
  "/contact",
];

/**
 * Where a page's social card lives, for a given language.
 *
 * English keeps the existing path so no committed card moves. The others are
 * nested by locale (`/og/ar/home.png`) because the card renders the page's
 * tagline in large type, and a shared Arabic page showing an English sentence is
 * the most visible way a "multilingual" site announces it is not.
 */
export function ogImagePathForLocale(path: string, code: LocaleCode, englishPath: string): string {
  if (code === DEFAULT_LOCALE) return englishPath;
  return englishPath.replace(/^\/og\//, `/og/${code}/`);
}

export function localeFor(code: string): Locale | undefined {
  return LOCALES.find((locale) => locale.code === code);
}

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((locale) => locale.code === value);
}

/** True when this path is published in languages other than English. */
export function isLocalisedPath(path: string): boolean {
  return LOCALISED_PATHS.includes(normalisePath(path));
}

/** Trailing slashes off, empty string treated as the home page. */
export function normalisePath(path: string): string {
  if (!path || path === "/") return "/";
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * The URL of a page in a given language.
 *
 * English keeps the bare path. Anything else gets the prefix, but only when
 * that page is actually translated, so a caller cannot accidentally mint a URL
 * that 404s.
 */
export function localePath(path: string, code: LocaleCode): string {
  const normalised = normalisePath(path);
  if (code === DEFAULT_LOCALE) return normalised;
  if (!isLocalisedPath(normalised)) return normalised;
  return normalised === "/" ? `/${code}` : `/${code}${normalised}`;
}

/**
 * Splits a request path into its locale and the page beneath it.
 *
 * "/ar/about" → { code: "ar", path: "/about" }; "/about" → { code: "en", path: "/about" }.
 * A prefix that is not a known locale is left alone, so a future "/areas" style
 * route beginning with two letters is never mistaken for a language.
 */
export function splitLocale(pathname: string): { code: LocaleCode; path: string } {
  const match = /^\/([a-z]{2})(?=\/|$)/.exec(pathname);
  const candidate = match?.[1];

  if (candidate && isLocaleCode(candidate) && candidate !== DEFAULT_LOCALE) {
    const rest = pathname.slice(candidate.length + 1);
    return { code: candidate, path: normalisePath(rest === "" ? "/" : rest) };
  }

  return { code: DEFAULT_LOCALE, path: normalisePath(pathname) };
}

/**
 * Which languages a given page exists in.
 *
 * English always; the rest only for the localised set. This is the single
 * function `hreflang` and the sitemap both read, which is what keeps the two
 * from drifting apart.
 */
export function localesForPath(path: string): readonly Locale[] {
  const english = LOCALES.filter((locale) => locale.code === DEFAULT_LOCALE);
  return isLocalisedPath(path) ? LOCALES : english;
}
