import type { ReactNode } from "react";

import { Parallax } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A photograph the type sits inside, rather than beside.
 *
 * The cinematic family. It is the most expensive thing on the page in
 * attention terms, so it is used where the reader should stop: the hero, and
 * at most one moment further down.
 *
 * The scrim is not optional and not decorative. Light type on an unknown
 * photograph is a contrast gamble; the gradient is what turns it into a
 * certainty, weighted to wherever the type actually is.
 */
export function FullBleed({
  photo,
  children,
  align = "end",
  height = "screen",
  priority = false,
  className,
  "aria-label": ariaLabel,
}: {
  photo: PhotoSlug;
  children: ReactNode;
  /** Where the type sits in the frame. */
  align?: "end" | "center";
  /** `screen` for a hero, `band` for a shorter cinematic break. */
  height?: "screen" | "band";
  priority?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      data-surface="dark"
      /*
       * Only the opening frame tells the masthead it may go transparent, and
       * `priority` is already exactly that claim: it is set on the one
       * photograph above the fold and nowhere else. A cinematic band further
       * down the page must not claim it, or the bar would lose its background
       * halfway through a scroll.
       */
      data-dark-opening={priority ? "" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "relative flex overflow-hidden",
        /* `main` reserves the masthead's height so a page that opens on paper
         * is not hidden underneath it. The opening frame gives that space back,
         * sliding up under the transparent bar it sits behind. */
        priority && "-mt-16 md:-mt-20",
        height === "screen" ? "min-h-[100svh] pb-16 lg:pb-24" : "min-h-[68svh] py-section",
        align === "end" ? "items-end" : "items-center",
        className,
      )}
    >
      <Parallax speed={0.82} className="absolute inset-x-0 -top-[8%] h-[116%]">
        <Photo
          slug={photo}
          sizes="100vw"
          priority={priority}
          className="h-full w-full object-cover"
        />
      </Parallax>

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          align === "end" ? "bg-gradient-to-t from-green/95 via-green/45 to-green/15" : "bg-green/65",
        )}
      />

      <Container className="relative">{children}</Container>
    </section>
  );
}
