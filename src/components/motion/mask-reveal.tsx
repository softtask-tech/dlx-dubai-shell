import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A photograph that uncovers itself.
 *
 * A plain fade says "an image loaded". A mask that lifts says "look at this
 * one". It is the difference between a picture appearing and a picture being
 * presented, and on a page whose argument is made in photography that
 * distinction is the argument. Reserved for the images that carry a section;
 * a thumbnail grid gets a plain reveal.
 *
 * Built in CSS rather than GSAP: it is a single transition on two properties
 * and it needs no scroll math, so paying for ScrollTrigger would be silly. The
 * image is in the HTML, fully visible; the mask is applied on the client before
 * paint and lifted by an IntersectionObserver, which means no JavaScript, a
 * failed hydration or reduced motion all land on the same finished picture.
 */
type MaskRevealProps = {
  children: ReactNode;
  /** Seconds to wait once the frame is in view, for staggering a pair. */
  delay?: number;
  className?: string;
};

export function MaskReveal({ children, delay = 0, className }: MaskRevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === "undefined") return;

    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-mask-reveal={state === "idle" ? undefined : state}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={cn("overflow-hidden", className)}
    >
      {children}
    </div>
  );
}
