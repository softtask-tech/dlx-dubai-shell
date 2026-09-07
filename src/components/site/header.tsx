import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, Sparkles, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { NAVIGATION_GROUPS } from "@/config/navigation";
import { useLocale } from "@/i18n";
import { CurrencyPicker } from "@/components/tools/money";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useLenis } from "@/components/motion/lenis-provider";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

export function Header() {
  const { code, pathIn, t } = useLocale();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    setMobileOpen(false);
    setActiveGroup(null);
  }, [pathname]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setActiveGroup(null);
      setMobileOpen(false);
      if (mobileOpen) mobileToggle.current?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);

  /*
   * Hold the page still behind the open sheet.
   *
   * Both halves are needed: `overflow: hidden` stops the browser's own scroll,
   * and Lenis has to be told separately because it drives the position itself
   * and would otherwise keep animating underneath the sheet.
   */
  useEffect(() => {
    if (!mobileOpen) return;
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = "hidden";
    lenis?.stop();
    return () => {
      style.overflow = previous;
      lenis?.start();
    };
  }, [mobileOpen, lenis]);

  return (
    <header
      /* Paper, always. The bar used to go transparent over a dark opening
       * frame, which meant every page had to open dark for the bar to be
       * legible. Inverting that is what lets the pages be bright. */
      data-surface="light"
      data-glass-bar=""
      data-masthead=""
      className="fixed inset-x-0 top-0 z-50 border-b border-border"
    >
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-6 px-5 md:h-20 md:px-10 lg:px-14">
        <a
          href={pathIn(code, "/")}
          aria-label={t.nav.homeAria}
          className="focus-ring flex shrink-0 items-center gap-3"
        >
          <Wordmark form="monogram" tone="ink" className="h-6 md:h-7" />
        </a>

        <nav aria-label="Primary navigation" className="hidden h-full items-stretch gap-8 lg:flex">
          {NAVIGATION_GROUPS.map((group) => {
            const open = activeGroup === group.label;
            const panelId = `nav-${group.label.toLowerCase().replace(/\s/g, "-")}`;
            return (
              <button
                key={group.label}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setActiveGroup(open ? null : group.label)}
                className={cn(
                  "focus-ring eyebrow relative flex items-center gap-1.5 transition-colors",
                  open ? "text-gold-ink" : "text-foreground hover:text-gold-ink",
                )}
              >
                {group.label}
                <ChevronDown
                  aria-hidden
                  className={cn("size-3 transition-transform", open && "rotate-180")}
                />
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 -bottom-px h-px origin-left bg-gold-ink transition-transform duration-300",
                    open ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={pathIn(code, "/directory")}
            aria-label="Search published property data"
            className="focus-ring grid size-11 place-items-center text-muted-foreground transition-colors hover:text-gold-ink"
          >
            <Search aria-hidden className="size-4" />
          </a>
          <a
            href="#ask"
            aria-label="Ask DLX AI"
            className="focus-ring hidden size-11 place-items-center text-muted-foreground transition-colors hover:text-gold-ink sm:grid"
          >
            <Sparkles aria-hidden className="size-4" />
          </a>
          <CurrencyPicker variant="bare" className="hidden xl:flex" />
          <LanguageSwitcher className="hidden xl:block" />
          {/* The one filled thing in the bar. Gold on dark is the only place
              the accent is allowed to become a surface rather than a line. */}
          <a
            href={pathIn(code, "/contact")}
            className="focus-ring eyebrow ms-3 hidden items-center bg-green px-5 py-2.5 text-on-dark transition-colors hover:bg-green-mid lg:inline-flex"
          >
            Speak to DLX
          </a>
          <button
            ref={mobileToggle}
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
            className="focus-ring grid size-11 place-items-center text-foreground lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden className="size-5" />
            ) : (
              <Menu aria-hidden className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* The mega-menu is a full-width green sheet, not a floating card. */}
      {activeGroup ? (
        <div
          id={`nav-${activeGroup.toLowerCase().replace(/\s/g, "-")}`}
          data-surface="light"
          className="glass-paper absolute inset-x-0 top-full hidden border-x-0 border-t-0 border-b border-border lg:block"
        >
          <div className="mx-auto grid max-w-shell grid-cols-12 gap-10 px-14 py-12">
            <div className="col-span-3">
              <p className="eyebrow text-gold-ink">{activeGroup}</p>
              <p className="display-3 mt-4">Where to look next.</p>
              <p className="caption mt-3 text-muted-foreground">
                Focused routes with useful published content.
              </p>
            </div>
            <div className="col-span-9 grid grid-cols-3 gap-x-10 gap-y-0">
              {NAVIGATION_GROUPS.find((group) => group.label === activeGroup)?.items.map((item) => (
                <a
                  key={item.href}
                  href={pathIn(code, item.href)}
                  className="focus-ring group block border-t border-border py-4 transition-colors hover:border-gold-ink"
                >
                  <span className="display-3 block transition-colors group-hover:text-gold-ink">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="caption mt-1 block text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/*
       * The mobile sheet.
       *
       * A full screen of green with the sections set large in the display
       * serif, rather than the cramped dropdown this used to be. A phone has
       * one thing to do at a time, and giving the menu the whole screen is
       * what lets the links be thumb-sized instead of merely tappable.
       *
       * `100dvh` and not `100svh` here: the sheet is fixed and should fill
       * whatever the viewport currently is, including as the browser chrome
       * retracts under the reader's thumb.
       */}
      {mobileOpen ? (
        <div
          id="mobile-navigation"
          data-surface="light"
          className="fixed inset-x-0 top-16 h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-paper lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
          >
            {NAVIGATION_GROUPS.map((group) => (
              <section key={group.label} className="border-b border-border py-6 first:pt-0">
                <p className="eyebrow text-gold-ink">{group.label}</p>
                <ul className="mt-4 grid gap-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={pathIn(code, item.href)}
                        className="focus-ring display-3 flex min-h-12 items-center py-1 transition-colors hover:text-gold-ink"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <a
              href={pathIn(code, "/contact")}
              className="focus-ring eyebrow mt-8 flex min-h-12 items-center justify-center bg-green px-5 text-on-dark"
            >
              Speak to DLX
            </a>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <CurrencyPicker variant="bare" />
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
