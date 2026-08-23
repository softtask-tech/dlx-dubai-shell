import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { isLocalisedPath } from "@/config/locales";
import { SITE_PAGES } from "@/config/site";
import { EnglishOnly } from "@/i18n/english-only";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { navLabel } from "@/i18n/nav-labels";
import { useLocale } from "@/i18n";
import { DURATION, EASE } from "@/lib/motion";
import { CurrencyPicker } from "@/components/tools/money";
import { cn } from "@/lib/utils";

/**
 * Navigation is derived from the page registry, so a new page cannot be
 * orphaned. The header shows the primary set; the footer shows everything.
 */
export const NAV_LINKS = SITE_PAGES.filter((page) => page.inPrimaryNav !== false).map((page) => ({
  label: page.label,
  to: page.path,
}));

export const ALL_NAV_LINKS = SITE_PAGES.map((page) => ({ label: page.label, to: page.path }));

export function Header() {
  const reduced = useReducedMotion();
  const { t, code, isTranslated, pathIn } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Escape closes the mobile menu and returns focus to the control that opened it. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-slow ease-editorial",
        scrolled
          ? "border-b border-border/70 bg-background/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-shell items-center justify-between px-6 md:px-10 lg:px-16">
        {/* Plain anchors rather than <Link>, throughout the localised chrome:
            the document's lang and dir come from the URL, and only a real
            navigation makes the browser re-apply them. */}
        <a
          href={pathIn(code, "/")}
          aria-label={t.nav.homeAria}
          className="font-display text-2xl leading-none tracking-monogram text-foreground"
          onClick={() => setOpen(false)}
        >
          DLX
        </a>

        <nav aria-label={t.nav.primaryLabel} className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.slice(1).map((item) => (
            <a
              key={item.to}
              href={pathIn(code, item.to)}
              className="eyebrow link-underline text-foreground/70 transition-colors hover:text-foreground"
            >
              {navLabel(item.to, t, item.label)}
              {isTranslated && !isLocalisedPath(item.to) ? <EnglishOnly /> : null}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {/* Currency before language: a reader who has already chosen their
              language is done with that control, but the price they are looking
              at is on the page in front of them. */}
          <CurrencyPicker variant="bare" className="hidden lg:flex" />
          <LanguageSwitcher className="hidden lg:block" />

          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="eyebrow text-foreground lg:hidden"
          >
            {open ? t.nav.closeMenu : t.nav.openMenu}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: DURATION.base, ease: EASE }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav aria-label={t.nav.primaryLabel} className="flex flex-col gap-6 px-6 py-10">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.to}
                  href={pathIn(code, item.to)}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl text-foreground"
                >
                  {navLabel(item.to, t, item.label)}
                  {isTranslated && !isLocalisedPath(item.to) ? <EnglishOnly /> : null}
                </a>
              ))}
            </nav>
            <div className="flex flex-col gap-6 border-t border-border px-6 py-8">
              <CurrencyPicker variant="bare" />
              <LanguageSwitcher />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
