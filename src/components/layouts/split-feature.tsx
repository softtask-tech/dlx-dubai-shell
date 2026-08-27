import type { ReactNode } from "react";

import { MaskReveal, Parallax } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container } from "@/components/ui/section";
import { PHOTOS, type PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A photograph on one side, an argument on the other.
 *
 * The workhorse of an editorial page, and the one family with a real risk
 * attached: three of these in a row is the zigzag every template site is made
 * of. Two consecutive is the cap, and `side` has to alternate when there are
 * two, or it is not a composition, it is a column.
 *
 * The image is deliberately not half the page. A 5/7 split reads as a
 * considered asymmetry; 6/6 reads as a slide layout, and the difference is
 * most of what separates this from the thing it is trying not to be.
 */
export function SplitFeature({
  photo,
  side = "start",
  eyebrow,
  children,
  aside,
  className,
  priority = false,
}: {
  photo: PhotoSlug;
  /** Which side the photograph sits on at desktop. Alternate between uses. */
  side?: "start" | "end";
  /** Optional, and rationed: one eyebrow per three sections across the page. */
  eyebrow?: ReactNode;
  children: ReactNode;
  /** A quiet column under the text: figures, a link, a freshness stamp. */
  aside?: ReactNode;
  className?: string;
  priority?: boolean;
}) {
  const imageFirst = side === "start";

  /*
   * The frame follows the photograph.
   *
   * Forcing every image into the same portrait box crops a wide skyline down
   * to a sliver of sky and water, which throws away the reason that frame was
   * chosen. A landscape original gets a landscape frame; a portrait one gets
   * the taller box it was shot for.
   */
  const frame = PHOTOS[photo].ratio > 1.15 ? "aspect-4/3" : "aspect-4/5";

  return (
    <section className={cn("py-section", className)}>
      <Container>
        <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-12">
          <div
            className={cn("lg:col-span-5", imageFirst ? "lg:order-1" : "lg:order-2 lg:col-start-8")}
          >
            {/* The frame is fixed and the photograph moves inside it, so the
                mask lifts on a box that never changes size and the section
                cannot shift as the image decodes. */}
            <MaskReveal className={cn("relative w-full", frame)}>
              <Parallax speed={0.9} className="absolute inset-x-0 -top-[6%] h-[112%]">
                <Photo
                  slug={photo}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  priority={priority}
                  className="h-full w-full object-cover"
                />
              </Parallax>
            </MaskReveal>
          </div>

          <div
            className={cn(
              "lg:col-span-6",
              imageFirst ? "lg:order-2 lg:col-start-7" : "lg:order-1 lg:col-start-1",
            )}
          >
            {eyebrow}
            {children}
            {aside ? <div className="mt-10">{aside}</div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
