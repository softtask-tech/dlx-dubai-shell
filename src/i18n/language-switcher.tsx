import { useRouterState } from "@tanstack/react-router";

import { isLocalisedPath, LOCALES, splitLocale, type LocaleCode } from "@/config/locales";
import { useLocale } from "./index";
import { cn } from "@/lib/utils";

/**
 * The language switcher.
 *
 * Four decisions worth stating.
 *
 * It keeps the reader where they are. Switching to Arabic from the services
 * page lands on the Arabic services page, not the Arabic homepage — being sent
 * back to the top is the single most common way a language switcher wastes
 * someone's time.
 *
 * It writes each language in that language. A reader who wants Arabic is
 * looking for العربية, not for the English word "Arabic" — a list of English
 * names is a switcher built for the people who made it.
 *
 * It has two forms. The header gets a select, because five languages and a
 * currency spelled out along a masthead is a row of controls competing with the
 * navigation, and this brand's whole argument is restraint. The footer gets the
 * full list, where there is room to breathe and a reader who has scrolled that
 * far is looking rather than glancing.
 *
 * It navigates for real. The document's `lang` and `dir` are set from the URL,
 * and only a real navigation makes the browser re-apply them — a soft client
 * transition into Arabic would leave the page left-to-right until the next
 * reload.
 */
export function LanguageSwitcher({
  className,
  layout = "select",
}: {
  className?: string;
  /** "select" for the header; "list" for the footer column. */
  layout?: "select" | "list";
}) {
  const { code: current, locale, t } = useLocale();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { path } = splitLocale(pathname);

  /* On a page with no translations there is nothing to switch between, and a
   * control whose every option leads to English is worse than no control. */
  if (!isLocalisedPath(path)) return null;

  if (layout === "select") {
    return (
      <select
        aria-label={t.language.ariaLabel}
        value={current}
        onChange={(event) => {
          window.location.href = hrefFor(event.target.value as LocaleCode, path);
        }}
        lang={locale.htmlLang}
        className={cn(
          "cursor-pointer border-0 bg-transparent text-sm text-foreground/70 outline-none transition-colors hover:text-accent",
          className,
        )}
      >
        {LOCALES.map((entry) => (
          <option key={entry.code} value={entry.code} lang={entry.htmlLang}>
            {entry.endonym}
          </option>
        ))}
      </select>
    );
  }

  return (
    <nav aria-label={t.language.ariaLabel} className={cn("flex flex-col gap-3", className)}>
      {LOCALES.map((entry) => {
        const isCurrent = entry.code === current;
        return (
          <a
            key={entry.code}
            href={hrefFor(entry.code, path)}
            hrefLang={entry.htmlLang}
            lang={entry.htmlLang}
            dir={entry.dir}
            /* `aria-current="true"` rather than "page": the current language is
             * a property of this page, not a different page in a set. */
            {...(isCurrent ? { "aria-current": "true" as const } : {})}
            className={cn(
              "text-sm transition-colors",
              isCurrent
                ? "text-foreground underline decoration-accent underline-offset-4"
                : "text-foreground/70 hover:text-accent",
            )}
          >
            {entry.endonym}
          </a>
        );
      })}
    </nav>
  );
}

function hrefFor(code: LocaleCode, path: string): string {
  if (code === "en") return path;
  return path === "/" ? `/${code}` : `/${code}${path}`;
}
