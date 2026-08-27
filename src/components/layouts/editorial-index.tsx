import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type IndexRow = {
  /** The row's own key, and the slug it links to. */
  id: string;
  to: string;
  title: string;
  /** One line. If it needs two, the row is doing too much. */
  summary: string;
  photo: PhotoSlug;
};

/**
 * A list of things, set as an index rather than as cards.
 *
 * Cards are the reflex and the reflex is wrong here. Nine services in nine
 * equal boxes is a grid of nine identical objects, which tells the reader that
 * every service is the same size and the same importance, which is false and
 * also boring. An index is how a monograph lists its contents: one row per
 * entry, a rule between them, a thumbnail that proves it is a real thing, and
 * the eye running down the left edge.
 *
 * Deliberately not numbered. A numbered list claims an order, and these have
 * none.
 */
export function EditorialIndex({
  rows,
  heading,
  intro,
  action,
  className,
}: {
  rows: readonly IndexRow[];
  heading: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-section", className)}>
      <Container>
        <div className="max-w-2xl">
          {heading}
          {intro}
        </div>

        <ul className="mt-14 border-t border-border">
          {rows.map((row, i) => (
            <li key={row.id}>
              <Reveal delay={stagger(i)}>
                <Link
                  to={row.to}
                  className="group flex items-center gap-6 border-b border-border py-6 transition-colors hover:border-accent md:gap-10"
                >
                  {/* Small, fixed, and cropped square: it is evidence that the
                      row is a real place, not a picture to look at. */}
                  <div className="w-20 shrink-0 overflow-hidden md:w-28">
                    <div className="aspect-square">
                      <Photo
                        slug={row.photo}
                        sizes="112px"
                        className="h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="display-3 transition-colors group-hover:text-accent">
                      {row.title}
                    </p>
                    <p className="caption mt-1.5 max-w-xl">{row.summary}</p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="eyebrow hidden shrink-0 transition-transform duration-slow ease-editorial group-hover:translate-x-1 md:block"
                  >
                    View
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        {action ? <div className="mt-8">{action}</div> : null}
      </Container>
    </section>
  );
}
