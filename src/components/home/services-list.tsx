import { ArrowRight } from "lucide-react";

import { Photo } from "@/components/site/photo";
import type { PhotoSlug } from "@/lib/photos";

/**
 * The practices, as a tight register.
 *
 * This layout is the one the brief singles out as previously broken, so it is
 * worth saying what broke. It was a CSS grid with three columns, thumbnail,
 * name and arrow. A grid places every child in a cell, so the description had
 * nowhere to go except a new grid row, where it sat under the thumbnail column
 * with a column and a half of empty page beside it. Every row was twice as
 * tall as it needed to be and the list read as a set of disconnected fragments.
 *
 * The fix is that a row is a flex line, not a grid. Three flex children:
 * thumbnail, a text block, an arrow. The name and the description are ordinary
 * block children *inside* the text block, so they stack the way text stacks and
 * the row's height is whatever the text needs. `min-w-0` on the text block is
 * what lets it shrink instead of forcing the row wider than its container.
 *
 * On a narrow screen the thumbnail shrinks rather than moving above the text.
 * Stacking it there would double the height of a five-item list on the screen
 * with least room, which is the same mistake the grid made, arrived at from
 * the other direction.
 */
export type ServiceRow = {
  slug: string;
  name: string;
  line: string;
  photo: PhotoSlug;
};

export function ServicesList({ services, hrefFor }: {
  services: readonly ServiceRow[];
  hrefFor: (slug: string) => string;
}) {
  return (
    <ul className="mt-10 border-t border-border">
      {services.map((service) => (
        <li key={service.slug} className="border-b border-border">
          <a
            href={hrefFor(service.slug)}
            className="focus-ring group flex items-center gap-5 py-5 ps-0 transition-[padding,background-color] duration-quick ease-editorial hover:bg-cream hover:ps-3.5 sm:gap-7 sm:py-6"
          >
            <span className="w-14 shrink-0 sm:w-21">
              <Photo
                slug={service.photo}
                sizes="(min-width: 640px) 84px, 56px"
                alt=""
                className="aspect-square grayscale-[65%] transition-[filter] duration-base ease-editorial group-hover:grayscale-0"
              />
            </span>

            {/* The text block. Name and line stack inside it as normal
                children, which is the whole point of the fix. */}
            <span className="min-w-0 flex-1">
              <span className="display-3 block">{service.name}</span>
              <span className="caption mt-1 block text-muted-foreground">{service.line}</span>
            </span>

            <ArrowRight
              aria-hidden
              className="hidden size-5 shrink-0 -translate-x-2 text-gold-deep opacity-0 transition-all duration-quick ease-editorial group-hover:translate-x-0 group-hover:opacity-100 rtl:-scale-x-100 sm:block"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
