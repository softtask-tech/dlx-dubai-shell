import type { ReactNode } from "react";

import { MaskReveal } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

export type MosaicCell = {
  id: string;
  photo: PhotoSlug;
  /** Rendered over the photograph, in the on-dark palette. */
  children: ReactNode;
  /** Optional link wrapping the whole cell. */
  href?: string;
};

/* Cells of deliberately different sizes. Six positions, fixed, because a
 * mosaic that reflows into equal boxes is a grid with extra steps. */
const SHAPES = [
  "lg:col-span-7 lg:row-span-2 aspect-4/3 lg:aspect-auto lg:min-h-[34rem]",
  "lg:col-span-5 aspect-4/3 lg:aspect-auto lg:min-h-[16.5rem]",
  "lg:col-span-5 aspect-4/3 lg:aspect-auto lg:min-h-[16.5rem]",
  "lg:col-span-4 aspect-4/3 lg:aspect-auto lg:min-h-[20rem]",
  "lg:col-span-4 aspect-4/3 lg:aspect-auto lg:min-h-[20rem]",
  "lg:col-span-4 aspect-4/3 lg:aspect-auto lg:min-h-[20rem]",
] as const;

/**
 * An image grid where the cells are not the same size.
 *
 * The uniform three-column card grid is the single most templated thing on the
 * web, and repeating it down a page is most of why the old build read as one.
 * Here the first cell is large enough to be a photograph you look at, and the
 * rest step down around it, so the eye has somewhere to start and a route
 * through rather than six equal claims on its attention.
 *
 * On a phone it collapses to a single column, in order, and the sizes stop
 * mattering. That is correct: a mosaic is a desktop composition, and pretending
 * otherwise on a 390px screen produces six letterboxes.
 */
export function MosaicGrid({
  cells,
  heading,
  action,
  className,
}: {
  /** Up to six. More than that is a listing page, not a section. */
  cells: readonly MosaicCell[];
  heading?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-section", className)}>
      <Container>
        {heading ? <div className="max-w-2xl">{heading}</div> : null}

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          {cells.slice(0, SHAPES.length).map((cell, i) => {
            const Wrapper = cell.href ? "a" : "div";
            return (
              <MaskReveal key={cell.id} delay={i * 0.05} className={cn("relative", SHAPES[i])}>
                <Wrapper
                  {...(cell.href ? { href: cell.href } : {})}
                  data-surface="dark"
                  data-surface-ground="none"
                  className="group relative flex h-full w-full items-end overflow-hidden"
                >
                  <Photo
                    slug={cell.photo}
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03]"
                  />
                  {/* Every cell carries type, so every cell needs the scrim. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent"
                  />
                  <div className="relative w-full p-6 lg:p-8">{cell.children}</div>
                </Wrapper>
              </MaskReveal>
            );
          })}
        </div>

        {action ? <div className="mt-12">{action}</div> : null}
      </Container>
    </section>
  );
}
