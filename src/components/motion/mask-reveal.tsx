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

    /*
     * The same three safeguards <Reveal> carries, and for the same reason.
     *
     * This one is worse when it fails: a pending mask is `clip-path: inset(0
     * 0 100% 0)`, which is not a faint element, it is a photograph that is
     * entirely gone. It still had the original negative root margin, so it
     * held the reveal until the frame was well inside the viewport and a
     * single flick could outrun it, which is exactly what left blank frames
     * on the off-plan page.
     */
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState("shown");
      return;
    }

    let raf = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setState("shown");
      window.clearTimeout(deadline);
      window.removeEventListener("scroll", backstop);
      observer.disconnect();
    };
    const backstop = () => {
      if (done) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) finish();
      });
    };
    window.addEventListener("scroll", backstop, { passive: true });

    /* Whatever else happens, the photograph is on screen within a second and
     * a half. The uncovering is the part that is allowed to fail. */
    const deadline = window.setTimeout(finish, 1500);

    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        finish();
      },
      /* A full viewport of lead-in, so the frame is uncovered before it is
       * reached rather than while it is being looked at. */
      { rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(deadline);
      window.removeEventListener("scroll", backstop);
      cancelAnimationFrame(raf);
    };
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
