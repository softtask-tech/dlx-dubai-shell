/**
 * The locale runtime.
 *
 * One provider at the root holds the language the current URL is in; `useT()`
 * hands components their dictionary. There is no lazy loading and no async
 * boundary: five dictionaries of UI copy are a few kilobytes, and a language
 * that arrives a tick after the paint would flash English at a reader who did
 * not ask for it.
 *
 * The locale is derived from the path rather than stored, because the path is
 * the only version a search engine, a shared link or the back button can all
 * agree on. A remembered preference that overrode the URL would mean two
 * readers opening the same link saw different languages — which is exactly the
 * bug that makes localised sites feel broken.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  localeFor,
  localePath,
  LOCALES,
  type Locale,
  type LocaleCode,
} from "@/config/locales";
import { ar } from "./ar";
import { en, type Dictionary } from "./en";
import { hi } from "./hi";
import { ru } from "./ru";
import { zh } from "./zh";

const DICTIONARIES: Record<LocaleCode, Dictionary> = { en, ar, hi, ru, zh };

export function dictionaryFor(code: LocaleCode): Dictionary {
  return DICTIONARIES[code] ?? en;
}

export type LocaleContextValue = {
  locale: Locale;
  code: LocaleCode;
  dir: "ltr" | "rtl";
  t: Dictionary;
  /** True when the reader is not on the default language. */
  isTranslated: boolean;
  /** The same page in another language, or the bare path when it has no translation. */
  pathIn: (code: LocaleCode, path: string) => string;
  /** Formats a number the way this language writes numbers. */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Formats a date the way this language writes dates. */
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ code, children }: { code: LocaleCode; children: ReactNode }) {
  const value = useMemo<LocaleContextValue>(() => {
    const locale = localeFor(code) ?? (localeFor(DEFAULT_LOCALE) as Locale);

    return {
      locale,
      code: locale.code,
      dir: locale.dir,
      t: dictionaryFor(locale.code),
      isTranslated: locale.code !== DEFAULT_LOCALE,
      pathIn: (target, path) => localePath(path, target),
      formatNumber: (value, options) =>
        new Intl.NumberFormat(locale.intlLocale, options).format(value),
      formatDate: (value, options) =>
        new Intl.DateTimeFormat(locale.intlLocale, options ?? { dateStyle: "long" }).format(
          typeof value === "string" ? new Date(value) : value,
        ),
    };
  }, [code]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * The current locale.
 *
 * Falls back to English rather than throwing. A component rendered outside the
 * provider — a portal, a test, an error boundary above the tree — should show
 * English copy, not take the page down.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context) return context;

  const locale = localeFor(DEFAULT_LOCALE) as Locale;
  return {
    locale,
    code: DEFAULT_LOCALE,
    dir: "ltr",
    t: en,
    isTranslated: false,
    pathIn: (target, path) => localePath(path, target),
    formatNumber: (value, options) =>
      new Intl.NumberFormat(locale.intlLocale, options).format(value),
    formatDate: (value, options) =>
      new Intl.DateTimeFormat(locale.intlLocale, options ?? { dateStyle: "long" }).format(
        typeof value === "string" ? new Date(value) : value,
      ),
  };
}

/** The dictionary alone, for the common case. */
export function useT(): Dictionary {
  return useLocale().t;
}

/**
 * Fills `{name}` placeholders.
 *
 * Deliberately the only interpolation this system does. Anything richer —
 * plurals, gender, ordinals — differs so much between Arabic, Russian and
 * Chinese that faking it produces sentences no native speaker would write; the
 * dictionaries phrase around it instead.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * The reader's most likely language, from the browser's own list.
 *
 * Only ever used to *offer* a translation, never to perform a redirect.
 * Auto-redirecting on `Accept-Language` sends a Russian speaker in London to
 * the Russian page they did not ask for, breaks the shared link they arrived
 * on, and — because a crawler announces no language at all — hides the
 * translated pages from the search engines they were built for.
 */
export function preferredLocale(acceptLanguage: readonly string[]): LocaleCode | null {
  for (const entry of acceptLanguage) {
    const base = entry.toLowerCase().split("-")[0];
    const match = LOCALES.find((locale) => locale.code === base);
    if (match && match.code !== DEFAULT_LOCALE) return match.code;
  }
  return null;
}

export type { Dictionary };
