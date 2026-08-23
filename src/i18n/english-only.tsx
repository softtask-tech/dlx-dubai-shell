import { useLocale } from "./index";
import { cn } from "@/lib/utils";

/**
 * The marker on a link that leaves a translated page for an English one.
 *
 * Most of the site — the guides, the journal, the listings, the area profiles —
 * is published in English only, and several of those pages carry visa
 * thresholds, fee schedules and tax statements. Publishing an unchecked
 * translation of a legal figure is the invented specific CLAUDE.md forbids, so
 * those pages wait for a qualified reviewer rather than a machine.
 *
 * What that leaves is a navigation problem, and the honest answer to it is the
 * one print has used for a century: mark the language on the link. A reader who
 * sees "الأدلّة (بالإنجليزية)" knows before they click. A reader who clicks an
 * unmarked link and lands in English concludes the translation is broken.
 *
 * Renders nothing on the English site, where the marker would be noise.
 */
export function EnglishOnly({ className }: { className?: string }) {
  const { isTranslated, t } = useLocale();
  if (!isTranslated) return null;

  return (
    <span
      lang="en"
      dir="ltr"
      title={t.common.inEnglishTitle}
      className={cn(
        "ms-2 align-baseline text-[0.7em] uppercase tracking-editorial opacity-55",
        className,
      )}
    >
      EN
    </span>
  );
}

/**
 * The full explanation, for the head of a page rather than beside a link.
 *
 * Says why the page is English, and offers the advisor — which does answer in
 * all five languages, from the same sources. That is a real alternative rather
 * than an apology, and it is the reason the guides can honestly stay untranslated.
 */
export function EnglishOnlyNotice({ className }: { className?: string }) {
  const { isTranslated, t } = useLocale();
  if (!isTranslated) return null;

  return (
    <aside
      className={cn("border-s-2 border-accent bg-secondary/60 px-6 py-5", className)}
      aria-label={t.language.notTranslatedTitle}
    >
      <p className="eyebrow">{t.language.notTranslatedTitle}</p>
      <p className="body-text mt-3 max-w-measure text-muted-foreground">
        {t.language.notTranslatedBody}
      </p>
      <a href="#ask=" className="eyebrow link-underline mt-4 inline-block text-accent">
        {t.language.askAdvisor}
      </a>
    </aside>
  );
}
