import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { loadScrollTrigger, scrollMotionAllowed } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useLenis } from "./lenis-provider";

/**
 * Depth: content and photography travelling at different speeds.
 *
 * What it communicates is distance. A background photograph moving slower than
 * the text over it reads as further away, which is what turns a full-bleed
 * image from a decorated rectangle into a place the reader is moving through.
 * That is the whole justification, and it is why the effect is reserved for
 * photography and never applied to a paragraph.
 *
 * `speed` is a multiplier on the scroll: below 1 the element lags behind the
 * page, above 1 it runs ahead. Keep it close to 1. Anything past about 1.3
 * stops reading as depth and starts reading as a glitch.
 *
 * The element must have room to travel. Give the image a scale or an inset
 * overflow so the movement never exposes an edge.
 */
type ParallaxProps = {
  children: ReactNode;
  /** Scroll multiplier. 0.75 lags, 1.15 leads. */
  speed?: number;
  className?: string;
};

export function Parallax({ children, speed = 0.85, className }: ParallaxProps) {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !scrollMotionAllowed(reduced)) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void loadScrollTrigger(lenis).then(({ gsap }) => {
      if (cancelled || !ref.current) return;

      const ctx = gsap.context(() => {
        /* The travel is expressed as a share of the element's own height, so a
         * tall hero and a short inset image move by proportionate amounts
         * rather than by the same number of pixels. */
        const distance = (1 - speed) * 100;
        gsap.fromTo(
          ref.current,
          { yPercent: -distance / 2 },
          {
            yPercent: distance / 2,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current!.parentElement ?? ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }, ref);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced, lenis, speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
