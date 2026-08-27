import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { useLenis } from "@/components/motion";
import { loadScrollTrigger, scrollMotionAllowed } from "@/lib/gsap";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * A track the reader moves through sideways.
 *
 * For a set of things that are worth looking at one at a time and that have no
 * ranking: residences, in this case. A vertical list of the same photographs
 * would say "here are three of many"; a track says "walk along these", which is
 * how a gallery hangs work and how this brand talks about a portfolio.
 *
 * On desktop the section pins and the track slides as the reader scrolls. That
 * is the second and last pinned moment on any page, and the budget is real:
 * two per page, site-wide, or the device stops being special.
 *
 * Below 768px, and under reduced motion, there is no pin and no hijack. The
 * track becomes an ordinary scroll-snap strip the reader swipes, which is what
 * a phone is already good at. Nothing is unreachable in either mode.
 */
export function HorizontalGallery({
  children,
  heading,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  heading?: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrap.current || !track.current || !scrollMotionAllowed(reduced)) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadScrollTrigger(lenis).then(({ gsap }) => {
      if (cancelled || !wrap.current || !track.current) return;

      const ctx = gsap.context(() => {
        const distance = () => (track.current?.scrollWidth ?? 0) - window.innerWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: wrap.current!,
            /* Pin at the top of the viewport, never at centre: starting
             * anywhere else means the reader watches the section slide halfway
             * up and stop, which is the usual way this pattern is got wrong. */
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }, wrap);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, lenis]);

  return (
    <section ref={wrap} aria-label={ariaLabel} className={cn("overflow-hidden", className)}>
      {heading ? (
        <Container className="pt-section pb-10">
          <div className="max-w-2xl">{heading}</div>
        </Container>
      ) : null}

      {/*
       * Two layouts in one element. With the pin, the track is a flex row GSAP
       * translates. Without it, the same row is a scroll-snap strip: same
       * markup, same order, no JavaScript required to reach anything in it.
       */}
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-section md:px-10 md:[scrollbar-width:none] lg:px-16 lg:overflow-visible"
      >
        {children}
      </div>
    </section>
  );
}
