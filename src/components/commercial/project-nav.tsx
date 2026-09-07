import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Where you are in a long project page, and a way to jump.
 *
 * A project page is not read top to bottom. A buyer arrives wanting one thing
 * (the payment plan, the handover date, what the service charge might be) and
 * a page that makes them scroll past four sections to find it is a page that
 * loses them. This is the fix, and it is also the only thing on the page that
 * reacts continuously to the reader, which is most of why the page stopped
 * feeling like a document.
 *
 * The active section is worked out from scroll position rather than from an
 * IntersectionObserver, deliberately: the sections here are taller than the
 * viewport, so "is it intersecting" is true for two of them at once and the
 * highlight flickers between them. Asking which heading the reader has most
 * recently passed gives one answer, always.
 *
 * It sticks under the masthead rather than over it, hides itself on a phone
 * where a horizontal rail of six items is its own problem, and every entry is
 * a real anchor, so it works with JavaScript off and a middle click opens the
 * section in a new tab like any other link.
 */
export type ProjectSection = { id: string; label: string };

export function ProjectNav({ sections }: { sections: readonly ProjectSection[] }) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    if (sections.length === 0) return;

    const read = () => {
      /* The line the reader is judged against: a third of the way down, not
       * the very top, or a heading counts as "reached" while it is still
       * below the fold. */
      const line = window.scrollY + window.innerHeight * 0.33;
      let current = sections[0]?.id ?? null;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top + window.scrollY <= line) current = section.id;
      }
      setActive(current);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Sections of this project"
      className="sticky top-16 z-30 hidden border-b border-border bg-paper/95 backdrop-blur-sm md:top-20 md:block"
    >
      <div className="mx-auto flex max-w-shell gap-8 overflow-x-auto px-6 md:px-10 lg:px-16">
        {sections.map((section) => {
          const current = active === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={current ? "true" : undefined}
              className={cn(
                "focus-ring eyebrow relative shrink-0 py-4 transition-colors",
                current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 -bottom-px h-0.5 origin-left bg-gold-ink transition-transform duration-quick ease-editorial",
                  current ? "scale-x-100" : "scale-x-0",
                )}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
