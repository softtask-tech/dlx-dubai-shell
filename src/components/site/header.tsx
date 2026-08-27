import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";

import { isLocalisedPath } from "@/config/locales";
import { SITE_PAGES } from "@/config/site";
import { EnglishOnly } from "@/i18n/english-only";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { navLabel } from "@/i18n/nav-labels";
import { useLocale } from "@/i18n";
import { DURATION, EASE } from "@/lib/motion";
import { CurrencyPicker } from "@/components/tools/money";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

/**
 * Navigation is derived from the page registry, so a new page cannot be
 * orphaned. The header shows the primary set; the footer shows everything.
 */
export const NAV_LINKS = SITE_PAGES.filter((page) => page.inPrimaryNav !== false).map((page) => ({
  label: page.label,
  to: page.path,
}));

export const ALL_NAV_LINKS = SITE_PAGES.map((page) => ({ label: page.label, to: page.path }));

/** Layout effects do not run on the server; fall back so SSR stays silent. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The masthead.
 *
 * One line, seven destinations, and nothing that is not a destination or a
 * control the reader will actually use. It has three states and they are all
 * motivated:
 *
 *   At the top of a page with a dark hero, it is transparent and set in the
 *   light on-dark palette, so the photograph runs unbroken to the top of the
 *   viewport and the brand mark sits in it rather than on a bar above it.
 *
 *   At the top of a page with a light opening, it is transparent and set in
 *   ink. Same composition, opposite tone.
 *
 *   Once the reader has scrolled, it becomes a solid paper bar and loses a
 *   little height. That is the one place the size change earns itself: the
 *   masthead has stopped being part of the composition and become a utility,
 *   so it should take less room.
 *
 * There is no scroll listener. A sentinel at the very top of the document,
 * watched by an IntersectionObserver, is what tells it the reader has moved.
 */
export function Header() {
  const reduced = useReducedMotion();
  const { t, code, isTranslated, pathIn } = useLocale();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* The sentinel sits at document top and is one pixel tall. While any of it
   * is on screen the reader has not really scrolled. */
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /*
   * Whether this page opens on a dark anchor.
   *
   * Read from the page rather than configured per route: a section that wants
   * the dark palette already declares `data-surface="dark"` for the tokens, so
   * the masthead can simply ask whether one of those starts at the very top.
   * A page that changes its own opening cannot forget to tell the header.
   */
  useIsomorphicLayoutEffect(() => {
    const first = document.querySelector<HTMLElement>('#main [data-surface="dark"]');
    const startsAtTop = Boolean(first) && first!.getBoundingClientRect().top + window.scrollY < 4;
    setOverDark(startsAtTop);
  }, [pathname]);

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

  /* A navigation closes the menu; leaving it open over the new page is the
   * kind of thing that only ever happens on sites nobody tested on a phone. */
  useEffect(() => setOpen(false), [pathname]);

  /* Light type is only correct while the masthead is actually over the dark
   * hero. The moment it turns into a paper bar it goes back to ink. */
  const onDark = overDark && !scrolled && !open;

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute inset-x-0 top-0 h-px" />

      <header
        /* Over a dark hero the masthead borrows the whole dark palette rather
         * than one text colour, so the nav links, the currency control and the
         * language select all flip with it. The ground stays transparent. */
        data-surface={onDark ? "dark" : undefined}
        data-surface-ground="none"
        className={cn(
          "fixed inset-x-0 top-0 z-50 text-foreground transition-[border-color] duration-base ease-editorial",
          scrolled || open
            ? "border-b border-border bg-background/95 backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        {/*
         * A short scrim under the masthead while it sits on a photograph.
         * Light type on an unknown image is a contrast gamble; this is the
         * thing that makes it a certainty, and it fades out entirely rather
         * than reading as a bar.
         */}
        {onDark ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/75 via-ink/35 to-transparent"
          />
        ) : null}
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-shell items-center justify-between px-6 transition-[height] duration-base ease-editorial md:px-10 lg:px-16",
            scrolled ? "h-16" : "h-20",
          )}
        >
          {/* Plain anchors rather than <Link>, throughout the localised chrome:
              the document's lang and dir come from the URL, and only a real
              navigation makes the browser re-apply them. */}
          <a
            href={pathIn(code, "/")}
            aria-label={t.nav.homeAria}
            className="shrink-0 transition-opacity duration-base ease-editorial hover:opacity-70"
            onClick={() => setOpen(false)}
          >
            {/*
             * The monogram, trimmed and given the whole bar.
             *
             * The stacked lockup was tried here first and measured: its
             * wordmark line is 9% of the artwork's height, so at any size an
             * 80px masthead can give it the name rendered about four pixels
             * tall, which is a texture rather than a word. The ligature at 44px
             * is legible, and the name is set in full in the footer, in the
             * page title, and in the schema, which is where a crawler reads it
             * anyway.
             */}
            <Wordmark
              form="monogram"
              tone={onDark ? "on-dark" : "ink"}
              className={cn(
                "transition-[height] duration-base ease-editorial",
                scrolled ? "h-9" : "h-11",
              )}
            />
          </a>

          {/*
           * The desktop nav switches in at `xl`, not `lg`.
           *
           * Seven labels, one of them "Market Intelligence", do not fit on a
           * 1024px line beside the mark and the two controls: the row wraps
           * to two lines, which is broken design, and the labels cannot be
           * shortened because they are the page names readers and crawlers
           * already know. So the tablet range gets the menu instead.
           */}
          <nav aria-label={t.nav.primaryLabel} className="hidden items-center gap-8 xl:flex">
            {NAV_LINKS.slice(1).map((item) => (
              <a
                key={item.to}
                href={pathIn(code, item.to)}
                /* On paper, `.eyebrow`'s muted grey is the right weight for a
                   masthead. Over a photograph it is not: the scrim controls the
                   worst case but the local background still varies across the
                   frame, so on dark the links take the full on-dark colour and
                   lean on the scrim rather than on the average. */
                className={cn(
                  "eyebrow link-underline whitespace-nowrap transition-colors",
                  onDark ? "text-foreground/90 hover:text-foreground" : "hover:text-foreground",
                )}
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
            <CurrencyPicker variant="bare" className="hidden xl:flex" />
            <LanguageSwitcher className="hidden xl:block" />

            <button
              ref={toggleRef}
              type="button"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className="eyebrow -me-1 p-1 text-foreground xl:hidden"
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
              className="overflow-hidden border-t border-border bg-background text-foreground xl:hidden"
            >
              <nav aria-label={t.nav.primaryLabel} className="flex flex-col gap-5 px-6 py-8">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.to}
                    href={pathIn(code, item.to)}
                    onClick={() => setOpen(false)}
                    className="display-3 text-foreground"
                  >
                    {navLabel(item.to, t, item.label)}
                    {isTranslated && !isLocalisedPath(item.to) ? <EnglishOnly /> : null}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-6 border-t border-border px-6 py-7">
                <CurrencyPicker variant="bare" />
                <LanguageSwitcher />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
