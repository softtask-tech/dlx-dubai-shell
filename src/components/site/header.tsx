import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, Sparkles, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { NAVIGATION_GROUPS } from "@/config/navigation";
import { useLocale } from "@/i18n";
import { CurrencyPicker } from "@/components/tools/money";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

export function Header() {
  const { code, pathIn, t } = useLocale();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/70 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-shell items-center justify-between gap-4 px-5 md:px-10 lg:px-16">
        <a
          href={pathIn(code, "/")}
          aria-label={t.nav.homeAria}
          className="focus-ring flex shrink-0 items-center gap-3"
        >
          <Wordmark form="monogram" tone="on-dark" className="h-8" />
          <span className="hidden text-eyebrow font-semibold tracking-monogram text-muted-foreground uppercase sm:block">
            {"Dubai"}
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden h-11 items-center rounded-full border border-border bg-secondary/60 px-1.5 lg:flex"
        >
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
                  "focus-ring eyebrow flex h-8 items-center gap-1.5 rounded-full px-4 transition-colors",
                  open ? "bg-accent text-accent-foreground" : "text-foreground hover:text-accent",
                )}
              >
                {group.label}
                <ChevronDown
                  aria-hidden
                  className={cn("size-3 transition-transform", open && "rotate-180")}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href={pathIn(code, "/directory")}
            aria-label="Search published property data"
            className="focus-ring grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-accent"
          >
            <Search aria-hidden className="size-4" />
          </a>
          <a
            href="#ask"
            aria-label="Ask DLX AI"
            className="focus-ring hidden size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-accent sm:grid"
          >
            <Sparkles aria-hidden className="size-4" />
          </a>
          <CurrencyPicker variant="bare" className="hidden xl:flex" />
          <LanguageSwitcher className="hidden xl:block" />
          <a
            href={pathIn(code, "/contact")}
            className="focus-ring eyebrow ms-2 hidden items-center rounded-full bg-primary px-5 py-3 text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-flex"
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
            className="focus-ring grid size-11 place-items-center rounded-full lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden className="size-5" />
            ) : (
              <Menu aria-hidden className="size-5" />
            )}
          </button>
        </div>
      </div>


      {activeGroup ? (
        <div
          id={`nav-${activeGroup.toLowerCase().replace(/\s/g, "-")}`}
          className="absolute inset-x-0 top-full hidden border-b border-border bg-background/95 backdrop-blur-xl lg:block"
        >
          <div className="mx-auto grid max-w-shell grid-cols-12 gap-6 px-16 py-8">
            <div className="col-span-3">
              <p className="eyebrow text-accent">{activeGroup}</p>
              <p className="body-text mt-3 text-muted-foreground">
                Focused routes with useful published content.
              </p>
            </div>
            <div className="col-span-9 grid grid-cols-3 gap-3">
              {NAVIGATION_GROUPS.find((group) => group.label === activeGroup)?.items.map((item) => (
                <a
                  key={item.href}
                  href={pathIn(code, item.href)}
                  className="focus-ring tile tile-interactive !p-4"
                >
                  <span className="font-display font-semibold tracking-display">{item.label}</span>
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

      {mobileOpen ? (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
        >
          <nav aria-label="Mobile navigation" className="px-5 py-7">
            {NAVIGATION_GROUPS.map((group) => (
              <section key={group.label} className="border-b border-border py-5 first:pt-0">
                <p className="eyebrow text-accent">{group.label}</p>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={pathIn(code, item.href)}
                        className="focus-ring block min-h-11 py-2.5 text-lg"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <CurrencyPicker variant="bare" />
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
