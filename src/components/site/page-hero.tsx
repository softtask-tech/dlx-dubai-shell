import type { ReactNode } from "react";

import { FullBleed } from "@/components/layouts";
import type { PhotoSlug } from "@/lib/photos";

/**
 * How an inner page opens.
 *
 * Every one of them opened the same way before this: about two hundred pixels
 * of nothing under the masthead, a small uppercase label, a very large word,
 * and a paragraph of grey text floating in the top right corner with a short
 * green rule under it. Seven pages, one shape, no photography, and the corner
 * paragraph is a recognisable tell on its own. It also meant the first thing a
 * reader saw on a property site was a blank screen.
 *
 * So an inner page opens on a photograph, in a band rather than a full screen,
 * because these pages have content to reach and only the homepage has earned a
 * viewport-height entrance. The lead sits under the title where it reads as
 * one thought instead of two.
 *
 * The `photo` is chosen per page rather than defaulted. Two pages opening on
 * the same picture would put the shape back.
 */
export function PageHero({
  photo,
  title,
  lead,
  children,
}: {
  photo: PhotoSlug;
  title: ReactNode;
  /** One sentence, under the title. Optional: a plain title is allowed. */
  lead?: ReactNode;
  /** A freshness stamp, a link, anything that belongs with the opening. */
  children?: ReactNode;
}) {
  return (
    <FullBleed photo={photo} height="band" priority>
      <div className="max-w-3xl">
        <h1 className="display-1 text-balance">{title}</h1>
        {lead ? <p className="lead mt-6 max-w-2xl text-on-dark-muted">{lead}</p> : null}
        {children}
      </div>
    </FullBleed>
  );
}
