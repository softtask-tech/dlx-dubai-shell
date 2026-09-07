import type { ReactNode } from "react";

import { MaskReveal, Parallax, Reveal } from "@/components/motion";
import { Photo } from "@/components/site/photo";
import { Container, Eyebrow } from "@/components/ui/section";
import type { PhotoSlug } from "@/lib/photos";

/**
 * How an inner page opens.
 *
 * This used to be a dark full-bleed band: a photograph with a heavy scrim over
 * it and white type inside. Two things were wrong with it. The type sat on a
 * picture rather than on the page, so every heading was a contrast gamble
 * decided by whichever frame happened to be behind it. And it made the site
 * dark by default, when the site is white.
 *
 * So the opening is inverted. The type sits on paper where it is simply
 * legible, and the photograph is a band beneath it: uncovered on scroll and
 * drifting slower than the page, so the picture is something the reader
 * arrives at rather than something they read through.
 *
 * The `photo` is chosen per page rather than defaulted. Two pages opening on
 * the same picture would put the old shape back.
 */
export function PageHero({
  photo,
  eyebrow,
  title,
  lead,
  children,
}: {
  photo: PhotoSlug;
  /** A short label above the title. Optional, and not on every page. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One sentence, under the title. Optional: a plain title is allowed. */
  lead?: ReactNode;
  /** A freshness stamp, a link, anything that belongs with the opening. */
  children?: ReactNode;
}) {
  return (
    <section data-surface="light" className="pt-14 md:pt-20">
      <Container>
        <div className="max-w-3xl">
          {eyebrow ? (
            <Reveal>
              <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          <Reveal delay={eyebrow ? 0.05 : 0}>
            <h1 className="display-1 text-balance">{title}</h1>
          </Reveal>
          {lead ? (
            <Reveal delay={0.1}>
              <p className="lead mt-7 max-w-2xl text-muted-foreground">{lead}</p>
            </Reveal>
          ) : null}
          {children ? <Reveal delay={0.15}>{children}</Reveal> : null}
        </div>
      </Container>

      {/* The photograph, as the thing under the headline rather than behind
          it. Held to a band: an inner page has content to reach and only the
          homepage has earned a viewport-height entrance. */}
      <MaskReveal className="mt-14 md:mt-20">
        <div className="relative h-[42svh] overflow-hidden md:h-[52svh]">
          <Parallax speed={0.88} className="absolute inset-x-0 -top-[8%] h-[116%]">
            <Photo slug={photo} sizes="100vw" priority className="h-full w-full object-cover" />
          </Parallax>
        </div>
      </MaskReveal>
    </section>
  );
}
