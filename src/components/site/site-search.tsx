import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import { SITE_PAGES } from "@/config/site";
import { searchMarketEntitiesFn } from "@/data/market-public.functions";
import { useLenis } from "@/components/motion/lenis-provider";
import { cn } from "@/lib/utils";

/**
 * Search, as one panel over the page.
 *
 * The magnifying glass in the masthead used to be a link to the directory,
 * which is a reasonable page and an unreasonable answer to a click on a search
 * icon. A reader who reaches for search has a word in mind, not a section.
 *
 * Two sources, deliberately kept apart in the results rather than blended into
 * one ranked list. The pages are the site's own registry, matched in the
 * browser because it is a small fixed list and a round trip to match twenty
 * strings would be slower than doing it here. The communities, projects and
 * developers come from the published Land Department records through the
 * existing search function, which is debounced because it is a database query
 * per keystroke otherwise.
 *
 * Nothing is invented when there is nothing to show: an empty query offers the
 * pages, and a query with no matches says so rather than rendering an empty
 * frame.
 */
type EntityHit = { entity_type: string; entity_id: string; name_en: string };

const ENTITY_HREF: Record<string, (id: string) => string> = {
  community: (id) => `/market-intelligence/communities/${id}`,
  project: (id) => `/directory/projects/${id}`,
  developer: (id) => `/directory/developers/${id}`,
};

const ENTITY_LABEL: Record<string, string> = {
  community: "Community",
  project: "Project",
  developer: "Developer",
};

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<EntityHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lenis = useLenis();

  /* Hold the page still behind the panel, both halves, for the same reason the
   * mobile menu does: Lenis drives the position itself. */
  useEffect(() => {
    if (!open) return;
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = "hidden";
    lenis?.stop();
    inputRef.current?.focus();
    return () => {
      style.overflow = previous;
      lenis?.start();
    };
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Clear on close, so reopening is a fresh search rather than the last one. */
  useEffect(() => {
    if (!open) {
      setQuery("");
      setEntities([]);
    }
  }, [open]);

  /* One query per pause in typing, not one per keystroke. */
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setEntities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchMarketEntitiesFn({ data: { query: term, limit: 8 } })
        .then((rows) => {
          if (!cancelled) setEntities(rows as EntityHit[]);
        })
        .catch(() => {
          if (!cancelled) setEntities([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const pages = useMemo(() => {
    const term = query.trim().toLowerCase();
    const candidates = SITE_PAGES.filter((page) => !page.path.startsWith("/admin"));
    if (!term) return candidates.slice(0, 6);
    return candidates
      .filter((page) =>
        [page.label, page.title, page.description].join(" ").toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [query]);

  if (!open) return null;

  const nothing = query.trim().length >= 2 && pages.length === 0 && entities.length === 0 && !loading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search this site"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[70vh] w-full max-w-2xl flex-col border border-border bg-paper shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3 border-b border-border px-5">
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <label htmlFor="site-search" className="sr-only">
            Search communities, projects, developers and pages
          </label>
          <input
            id="site-search"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search communities, projects, developers"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="focus-ring grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {entities.length > 0 ? (
            <Group label="In the Land Department record">
              {entities.map((hit) => (
                <Row
                  key={`${hit.entity_type}-${hit.entity_id}`}
                  href={ENTITY_HREF[hit.entity_type]?.(hit.entity_id) ?? "/directory"}
                  title={hit.name_en}
                  meta={ENTITY_LABEL[hit.entity_type] ?? "Record"}
                />
              ))}
            </Group>
          ) : null}

          {pages.length > 0 ? (
            <Group label={query.trim() ? "Pages" : "Start here"}>
              {pages.map((page) => (
                <Row key={page.path} href={page.path} title={page.label} meta={page.tagline} />
              ))}
            </Group>
          ) : null}

          {loading && entities.length === 0 ? (
            <p className="caption px-5 py-6 text-muted-foreground">Searching the record...</p>
          ) : null}

          {nothing ? (
            <p className="body-text px-5 py-8 text-muted-foreground">
              Nothing matched &ldquo;{query.trim()}&rdquo;. The record covers Dubai communities,
              projects and developers; try a community name, or ask the advisor.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="border-b border-border last:border-b-0">
      <h2 className="eyebrow px-5 pt-5 pb-2 text-gold-ink">{label}</h2>
      <ul className="pb-3">{children}</ul>
    </section>
  );
}

function Row({ href, title, meta }: { href: string; title: string; meta?: string }) {
  return (
    <li>
      <a
        href={href}
        className={cn(
          "focus-ring flex items-baseline justify-between gap-4 px-5 py-3 transition-colors hover:bg-cream",
        )}
      >
        <span className="display-3 truncate">{title}</span>
        {meta ? <span className="caption shrink-0 text-muted-foreground">{meta}</span> : null}
      </a>
    </li>
  );
}
